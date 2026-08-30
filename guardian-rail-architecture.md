# Guardian Rail — Architecture Doc

## 1. System overview

Guardian Rail has four moving parts: a **user-side app** (where DOB/consent data lives and never leaves), a **wallet** (key custody + proof generation), the **Midnight network** (contract + ledger + nullifier tracking), and the **AI platform side** (middleware + the chatbot it protects). No component other than the user's own device ever sees the raw birthdate.

```mermaid
flowchart TB
    subgraph User["User's device (trust boundary: private data lives ONLY here)"]
        DOB["Local credential store<br/>(birthdate + issuer signature)"]
        Witness["Witness functions<br/>(TypeScript, local)"]
    end

    subgraph Wallet["Wallet (Lace / 1AM)"]
        WalletUI["Wallet UI / key custody"]
        ProofServer["Local Proof Server<br/>(Docker, :6300)"]
    end

    subgraph Frontend["Guardian Rail Frontend (Next.js App Router)"]
        Connector["DApp Connector API"]
        UIFlow["Connect wallet → enter DOB locally<br/>→ request proof"]
    end

    subgraph Midnight["Midnight Network"]
        Node["Midnight Node (testnet/local)"]
        Contract["Guardian Rail Compact Contract<br/>ledger: policy_version, issuer_pubkey_commitment, used_nullifiers"]
        Indexer["Indexer (GraphQL)<br/>queryable on-chain state"]
    end

    subgraph Platform["AI Platform Side"]
        Middleware["Middleware (Node/Express)<br/>polls Indexer for valid unused proof"]
        Chatbot["Demo Chatbot UI<br/>locked until middleware confirms proof"]
    end

    DOB --> Witness
    Witness -->|private inputs, never leave device| Connector
    UIFlow --> Connector
    Connector --> WalletUI
    WalletUI --> ProofServer
    ProofServer -->|ZK proof + disclosed boolean only| Node
    Node --> Contract
    Contract --> Indexer
    Indexer --> Middleware
    Middleware --> Chatbot
```

## 2. Component responsibilities

| Component | Responsibility | Never does |
|---|---|---|
| Local credential store | Holds the user's `(birthdate, issuer signature)` | Never transmitted anywhere, including to the wallet's backend |
| Witness functions | Feed private data into the circuit at proof-generation time | Never write to the public ledger directly |
| Wallet (Lace/1AM) | Key custody, orchestrates local proof generation, signs the transaction | Never sees a "plaintext age" concept — only sees circuit inputs/outputs per Compact's disclosure rules |
| Local Proof Server | Generates the ZK proof from the circuit + witness data | Never persists user data between runs (stateless prover) |
| Guardian Rail Contract | Verifies the proof, enforces the nullifier check, updates `used_nullifiers` | Never stores birthdate, signature, or user secret — only ever stores the boolean-adjacent commitments and nullifier hashes |
| Indexer | Lets the middleware query "is there a valid, unused proof for context X" | Never exposes any field the contract didn't already disclose |
| Middleware | Bridges the AI platform's session logic to on-chain proof state | Never asks the user for ID/DOB itself |
| Chatbot UI | The thing being protected | Never receives, requests, or stores age data |

## 3. Data flow — the "prove age" sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (Next.js)
    participant W as Wallet (Lace/1AM)
    participant P as Local Proof Server
    participant N as Midnight Node
    participant I as Indexer
    participant M as Middleware
    participant C as Chatbot UI

    U->>C: Opens chatbot, sees "locked" state
    C->>M: checkAccess(sessionId)
    M->>I: query proof status for context_id
    I-->>M: no valid proof yet
    M-->>C: remain locked

    U->>F: Connects wallet, enters DOB locally
    F->>W: request proveAge(threshold, context_id)
    W->>W: run witness fn (reads local credential)
    W->>P: generate ZK proof (circuit + private witness data)
    P-->>W: proof + disclosed boolean
    W->>N: submit transaction (proof only, no raw data)
    N->>N: verify proof, check nullifier unused, insert nullifier
    N-->>I: updated ledger state (nullifier spent, policy_version, etc.)

    C->>M: checkAccess(sessionId) [poll again]
    M->>I: query proof status for context_id
    I-->>M: valid, unused-until-now proof confirmed
    M-->>C: unlock chatbot
    C-->>U: chatbot now accessible

    Note over U,N: Replay attempt
    U->>F: tries to submit the same proof/context again
    F->>W: request proveAge(threshold, context_id) [same context]
    W->>P: generate proof
    P-->>W: proof
    W->>N: submit transaction
    N->>N: nullifier already in used_nullifiers → reject
    N-->>F: transaction rejected
```

## 4. Trust boundaries (what's visible where)

- **Inside the user's device:** raw birthdate, issuer signature, user secret key. This never crosses out.
- **Crossing to the wallet/proof server:** the same private data, but only to *generate* a proof — the proof server is intended to be local (Docker on the user's own machine or the wallet's own sandboxed environment), not a third-party server.
- **Crossing to the Midnight network (public):** only the ZK proof itself, the disclosed boolean (`true`/`false`), and the derived nullifier hash. No birthdate, no signature, no user secret.
- **Visible to the AI platform (via Indexer/middleware):** only "this context_id has a valid, unused proof" — a boolean-shaped fact, nothing else.

## 5. Deployment topology

**Current local development:**
```
Docker: Midnight proof server only   (npm run env:up)
   ↕
localhost:6300 (proof server)
   ↕
Frontend (localhost:3000, Next.js dev server) + Middleware (localhost:4000)
```

The current browser flow uses a demo verifier and does not yet submit a real
Midnight proof. A local Midnight node and Indexer are future infrastructure,
not currently included in Docker Compose.

**Demo deployment (testnet, as a fallback layer, not a dependency):**
```
Midnight preprod/testnet node (hosted by Midnight Foundation)
   ↕
Testnet Indexer (hosted GraphQL endpoint)
   ↕
Your deployed contract address on testnet
   ↕
Frontend + Middleware pointed at testnet endpoints instead of localhost
```
Keep both configurations working via an environment variable switch (`NETWORK=local` vs `NETWORK=testnet`) so a flaky testnet or conference wifi doesn't sink the live demo — default to local for the actual judging run, and only show testnet if asked "does this actually work on the real network."

## 6. Why this shape satisfies the judging criteria

- **Technology:** exercises the full Compact privacy model — witnesses, `disclose()`, nullifiers, sealed ledger fields — not just a toy counter contract.
- **Originality:** applies Midnight's canonical "compliant identity" pattern to a specific, currently-contested problem (AI chatbot age verification) rather than a generic demo.
- **Completion:** the local-first deployment topology means you can guarantee a working end-to-end demo even if testnet or wifi misbehaves.
- **Business value:** the middleware/chatbot split mirrors exactly how a real AI platform would integrate this — as a bolt-on gate in front of existing infrastructure, not a rewrite.
