# Guardian Rail

Guardian Rail is a privacy-preserving age and consent gate for AI chat and
companion applications. A user should be able to prove that they meet a policy
such as “18+” without giving the platform their birthdate, government ID,
selfie, or a permanent identity-to-chat-history link.

The intended production design uses Midnight zero-knowledge proofs: a locally
held credential is checked by a Compact circuit, the network records only the
proof result and a context-specific nullifier, and the AI platform unlocks its
chat after querying the Indexer.

## Current status

Guardian Rail has a working browser-to-Lace live transaction path and the first
version of its Compact contract source. Preprod deployment and issuer
registration still require wallet-signed transactions.

1. The Next.js browser client creates a private access session.
2. The user enters a DOB, which is evaluated only in the browser.
3. The browser generates and submits a context-bound `proveAge` transaction
   through Lace; it does not submit the DOB.
4. The Express backend waits for Indexer confirmation of the transaction and
   on-chain nullifier before unlocking chat.

The demo demonstrates the intended privacy boundary, session lifecycle, and
replay-protection UX. It must not be used as a production age-verification
system until the Compact contract is compiled and deployed, local proof
generation is connected, and the backend verifies results through the Indexer.

### What is implemented

- Next.js App Router frontend, using Coss UI and Motion Primitives.
- Express access-gate API, local sessions, and one-time demo nullifiers.
- A server-only Ed25519 mock-credential issuer and CLI for local testing.
- Docker Compose configuration for Midnight Proof Server at port `6300`.
- Compact contract source with issuer-authorized credential registration, a
  private age-policy assertion, policy versioning, and per-context spent
  nullifiers: `contracts/guardian-rail/src/guardian-rail.compact`.

### What still requires Preprod setup

- The contract has not yet been deployed and its address is not in `.env`.
- The issuer credential commitment has not yet been registered on-chain.
- Credential expiry/revocation and a production issuer remain future work.
- The mock issuer signature is not yet represented inside the Compact proof.
  In the first contract version, on-chain credential registration by the issuer
  is the trusted issuance step.

## Architecture

```text
Next.js client (local DOB + wallet)
        │  proof result / nullifier only
        ▼
Midnight Compact contract ──► Midnight Indexer ──► Express access gate
                                                       │
                                                       ▼
                                                Protected AI chat
```

In the current demo, the Express service temporarily stands in for the
contract/Indexer verification step.

## Repository layout

```text
apps/
  frontend/              Next.js App Router UI, Coss UI, Motion Primitives
  backend/               Express access gate and mock issuer helper
contracts/
  guardian-rail/         Future Midnight Compact contract and deploy scripts
infra/                   Future local node, proof server, and Indexer config
```

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- Docker Desktop for the future local Midnight environment
- Ubuntu on WSL 2 for Compact development on Windows

## Local development

Install all workspace dependencies from the repository root:

```bash
npm install
```

Create local environment files:

```bash
copy apps\backend\.env.example apps\backend\.env
copy apps\frontend\.env.example apps\frontend\.env
```

On macOS/Linux, use `cp` instead of `copy`.

Start the services in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Open `http://localhost:3000`. The backend defaults to `http://localhost:4000`.

Create a local test credential (the output is ignored by Git):

```bash
npm run issuer:generate-keypair --workspace=@guardian-rail/middleware
npm run issuer:issue --workspace=@guardian-rail/middleware -- 2000-01-01
```

Start the documented local proof server with `npm run env:up`.

## Midnight developer setup (Windows)

Run Compact commands inside Ubuntu/WSL, from the repository mounted at
`/mnt/c/Arpit/Coding/Guardian-Rail`. The Compact devtool and toolchain `0.31.1`
are installed there. Confirm the compiler is available with:

```bash
cd /mnt/c/Arpit/Coding/Guardian-Rail
compact compile --version
```

Your Lace configuration is correct for the current Preprod environment:

- Network: **Preprod**
- Proof server: **Local** — `http://localhost:6300`

The proof server helps Lace create proofs locally. It is not the backend
Indexer URL and does not need to be added as `MIDNIGHT_INDEXER_URL`.

## Verification

```bash
npm run typecheck
npm run build
```

## UI implementation rules

The frontend uses Next.js App Router, Coss UI, and Motion Primitives. Read
[Design.md](Design.md) before changing the UI. It defines the mandatory
component sourcing order and token system.

## Remaining work

### Next milestone: a local compiled contract

1. Compile `guardian-rail.compact` in WSL and fix any compiler diagnostics.
2. Add the generated Compact TypeScript package and witness implementations.
3. Create a local issuer-to-contract registration flow and contract tests.

### Required for an end-to-end Preprod DApp

- Add Lace/1AM DApp Connector integration and wallet/proof status UX.
- Deploy the compiled contract to Preprod and save its address in environment
  configuration.
- Replace `DemoProofVerifier` with Indexer-backed verification of the deployed
  contract and submitted nullifier.
- Configure Indexer access and the required deployment scripts.

### Required before production

- Replace the mock issuer with a real credential issuer/KYC or government eID
  provider, with a security-reviewed ZK attestation design.
- Implement credential expiry, revocation, parental consent, and recovery.
- Add authentication, durable session storage, rate limiting, and monitoring.
- Carry out security, privacy, and legal review before processing real users.
