# Guardian Rail
### ZK age & consent gate for AI chat/companion apps — built on Midnight
**MLH Midnight Hackathon, Aug 28–30 2026**

---

## 1. The idea

AI companion and chatbot platforms (Character.AI, general-purpose LLM chat apps) are being forced by law and by lawsuits to know whether a user is a minor before granting full access. Every current solution — uploading a government ID, taking a selfie for age-estimation — creates a **centralized honeypot**: a permanent, subpoenable, hackable link between a person's real identity and every message they've ever sent an AI. Anthropic added biometric ID verification to Claude in 2026 and drew user pushback for exactly this reason; Discord's ID/selfie plan was delayed after backlash; OpenAI and Character.AI have both shipped ID-based age checks under regulatory pressure.

**Guardian Rail is a drop-in proof layer**: an AI platform asks a user to prove *"I am 18+"* (or *"I have verified parental consent"*), and gets back only a **yes/no cryptographic proof** — never a birthdate, never a photo, never a document. The platform can't reconstruct the user's age, can't link the proof to a real-world identity, and can't be subpoenaed for data it never collected in the first place.

**Who it's for:** any AI chat/companion app, social platform, or age-restricted service that currently has to choose between "collect IDs" and "ignore the law."

---

## 2. What we're actually proving (the core mechanic)

1. A user holds a **credential** — for the hackathon demo, this is a self-attested date of birth signed by a mock "issuer" (standing in for a real KYC provider / government eID in a production version).
2. The user's wallet runs a **local witness function** that reads this credential off-device.
3. A **Compact circuit** takes the credential as private input, checks:
   - the issuer's signature is valid (the credential is authentic), and
   - `today − birthdate ≥ threshold_age`
4. The circuit outputs **only a boolean** (`disclose(true)`), wrapped with a **nullifier** tied to *(user secret, platform/context ID)* so the same proof can't be silently reused to create unlimited fake accounts on the same platform, but a fresh nullifier is generated per platform so no two platforms can correlate the same user across services.
5. The AI platform's backend checks the Midnight ledger (via the Indexer) for a valid, unused proof for that session — and unlocks access. Nothing else about the user ever leaves their device.

---

## 3. MVP scope for the hackathon (what we will actually build in 48 hours)

We are **not** building a real KYC/issuer network this weekend — that's out of scope and not the point of the demo. We're proving the on-chain mechanic works end-to-end and wrapping it around a real (small) chatbot so judges see the "before vs. after."

**In scope:**
- [ ] One Compact contract with: ledger state, one primary circuit (`proveAge`), witness function, `disclose()`-gated output, nullifier set, sealed policy field
- [ ] A minimal mock "issuer" — a script that signs a `(birthdate)` credential with a test keypair, standing in for a real KYC provider
- [ ] A small web frontend: connect wallet → enter DOB locally (never transmitted) → generate proof → submit transaction
- [ ] A tiny demo chatbot (wrap an existing open-source small LLM chat UI, or a scripted mock chat) that is locked until the middleware sees a valid proof for that session
- [ ] A middleware/backend service that queries the Indexer for proof status and flips the chatbot's access flag
- [ ] A **replay-attack demo**: show that trying to reuse the same proof on the same platform a second time fails (nullifier already spent), proving the anti-Sybil property live

**Explicitly out of scope for the hackathon (mention as roadmap in the pitch):**
- Real integration with an actual government ID / eID issuer
- Parental-consent flow (mentioned as a v2 feature, not built)
- Mobile app (web demo only)
- Production-grade key management / recovery

---

## 4. How we're going to build it (phased plan)

**Phase 0 — Setup (first 2–3 hours)**
- Install toolchain: Node 20.x, Docker Desktop, Compact compiler + VS Code extension, `create-mn-app`
- Scaffold project with `create-mn-app`, get the sample Counter/Bulletin Board contract compiling and deploying locally to confirm the whole toolchain (proof server, indexer, node) works before writing custom logic
- Install Lace Midnight Preview wallet (or 1AM wallet), get testnet `tDUST` from the faucet
- Split into workstreams (see team split below)

**Phase 1 — Contract (hours 3–14)**
- Write the ledger declarations, the mock-issuer signature check, the age-threshold assertion, the nullifier logic, `disclose()` wrapping
- Compile with `compactc`, fix type errors, get unit-level circuit calls working against the local proof server
- Write the mock issuer signing script (Node/TS, outside the contract)

**Phase 2 — Frontend + wallet integration (hours 8–24, parallel with Phase 1)**
- Scaffold React + Vite app
- Wire up DApp Connector API to detect/connect Lace or 1AM wallet
- Build the "enter DOB → generate proof → submit" flow against the *local* proof server first, then the testnet
- Handle the loading states around proof generation (this can take a few seconds — plan the UI around it)

**Phase 3 — Chatbot + middleware (hours 20–32)**
- Stand up a minimal chat UI (can be a very simple scripted/templated chatbot — the point is the gate, not the chatbot's intelligence)
- Build a small Node/Express middleware that polls the Indexer's GraphQL endpoint for "has this session produced a valid unused proof for this context ID" and flips a boolean that unlocks the chat UI

**Phase 4 — Integration + demo polish (hours 32–42)**
- Full end-to-end run-through: fresh user → blocked chatbot → connects wallet → proves age → chatbot unlocks
- Build and rehearse the **replay-attack demo**: second attempt at the same proof visibly fails
- Deploy contract to testnet (not just local), confirm the demo works off a teammate's laptop, not just the one that built it

**Phase 5 — Pitch deck + rehearsal (hours 42–48)**
- 3–4 slides: problem (with the sourced articles from our research), how it works (1 diagram), live demo, business case / roadmap
- Time-box the demo to 90 seconds; have a recorded backup video in case live wifi/proof-server breaks

---

## 5. Tech stack & what to install

**Local dev environment**
- Node.js 20.x (use nvm)
- Docker Desktop — runs the local proof server, indexer, and midnight-node together (`yarn env:up` / `yarn env:down` pattern)
- Yarn (Midnight tooling defaults to yarn scripts)
- VS Code + **Compact Language Support** extension (syntax highlighting, snippets)
- **Compact compiler** (`compactc`) — target version **0.28.0** (confirm current version in the `#dev-chat` Discord channel before you start; Midnight ships fast)
- **create-mn-app** — scaffolds a new Midnight project from npm or GitHub in seconds; start here instead of from a blank repo

**Wallet**
- **Lace Midnight Preview** (Chrome extension) — set its local proof-server endpoint to `http://localhost:6300` under Settings → Midnight, **or**
- **1AM wallet** — an alternative Midnight-native wallet with in-browser ZK proving and a documented developer SDK; either works, pick whichever your team gets running fastest
- Testnet `tDUST` from the official faucet (needed to pay any network fees during proof submission)

**Core npm packages (frontend/TypeScript layer)**
```
@midnight-ntwrk/compact-js
@midnight-ntwrk/midnight-js-contracts
@midnight-ntwrk/midnight-js-types
@midnight-ntwrk/midnight-js-fetch-zk-config-provider
@midnight-ntwrk/midnight-js-indexer-public-data-provider
@midnight-ntwrk/midnight-js-network-id
@midnight-ntwrk/ledger-v8
@midnight-ntwrk/wallet-sdk       # if building custom wallet interaction beyond the connector
@midnight-ntwrk/dapp-connector-api
```
(Confirm exact package names/versions against `docs.midnight.network/sdks` at hack-start — Midnight ships new majors mid-quarter, e.g. `midnight-js 3.0.0`, `wallet-sdk 1.0.0` were current as of Feb 2026.)

**Frontend app**
- React + Vite + TypeScript (Midnight's own tutorials are written against this combo, so the most help/examples exist here)
- Tailwind CSS for fast styling (skip building a design system this weekend)

**Backend / middleware**
- Node.js + Express (or Fastify) — a thin service whose only job is: query the Indexer's GraphQL endpoint for proof/nullifier state, expose a simple REST endpoint the chatbot frontend polls
- A GraphQL client (e.g. `graphql-request`) to talk to the Indexer

**Mock issuer (hackathon-only stand-in for a real KYC/eID provider)**
- A short Node/TS script using any standard signing library (e.g. `@noble/curves` or `tweetnacl`) to sign a `(birthdate)` payload with a test keypair — this represents "the government/KYC provider says this person's DOB is X" without you having to integrate a real identity provider this weekend

---

## 6. Contract design specifics (Compact)

**Ledger (public, on-chain state):**
- `policy_version: Counter` — sealed after init; lets the "platform" bump its minimum-age policy without redeploying
- `issuer_pubkey_commitment: Bytes<32>` — commitment to the mock issuer's public key
- `used_nullifiers: Set<Bytes<32>>` — every context-specific nullifier that's already been spent

**Witness (off-chain, local TypeScript, never touches the ledger):**
- `getCredential()` — reads the user's locally-stored signed `(birthdate, signature)` credential
- `getUserSecret()` — reads the user's local secret key material used to derive their nullifier

**Circuit — `proveAge(threshold_days: Field, context_id: Bytes<32>) -> Boolean`:**
1. Pull `(birthdate, signature)` and `user_secret` via witnesses
2. `assert(verifySignature(issuer_pubkey_commitment, birthdate, signature), "invalid credential")`
3. `assert(today() - birthdate >= threshold_days, "does not meet age threshold")`
4. `nullifier = transientHash(user_secret, context_id)`
5. `assert(!used_nullifiers.contains(nullifier), "proof already used for this context")`
6. `used_nullifiers.insert(nullifier)`
7. `return disclose(true)` — **only** the boolean crosses the disclosure boundary; birthdate, signature, and user secret never do

This is deliberately close to Midnight's own "compliant identity" / Merkle-allowlist reference patterns, which means there's real documentation and community tutorials to lean on if the team gets stuck.

---

## 7. Team split (suggested for 3–4 people)

| Role | Owns |
|---|---|
| Contract engineer | Compact contract, mock issuer script, local proof-server testing |
| Frontend/wallet engineer | React app, DApp Connector integration, proof-generation UX |
| Integration/middleware engineer | Node middleware, Indexer queries, wiring the chatbot's lock/unlock state |
| Demo & pitch owner | Chatbot UI polish, replay-attack demo script, slides, timing rehearsal |

If you're a 2-person team: merge contract+middleware into one role and frontend+demo into the other.

---

## 8. Risks & fallbacks

- **Proof generation is slow/flaky in the browser** → fall back to a pre-recorded demo video segment for that step only, and do the rest live.
- **Testnet congestion/instability** → keep the entire demo runnable against the *local* proof server + node as a fallback; don't depend on testnet uptime for the live demo.
- **Compact version drift mid-weekend** → pin exact versions in `package.json` the moment your toolchain works; don't `npm update` mid-hackathon.
- **Running out of time for the chatbot UI** → the chatbot can be extremely simple (even a few scripted canned responses) — the judged innovation is the proof gate, not chatbot intelligence. Don't over-invest here.
