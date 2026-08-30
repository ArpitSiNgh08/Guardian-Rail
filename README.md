# Guardian Rail — private age gate for AI access

**Problem + solution:** AI services need an age/consent decision, but should not collect a person's date of birth, ID, or photo. Guardian Rail uses a Midnight Compact zero-knowledge circuit to prove an issuer-registered credential meets an 18+ policy, then unlocks chat only after the Midnight Indexer confirms the on-chain, context-specific nullifier.

## Judge quick view

- **Demo:** run locally at `http://localhost:3000`; a Lace wallet on Midnight Preprod is used for the live flow.
- **Deployed Preprod contract:** `615262496a6e09fd689829387af7c11b814c1f6a0c31fb6a91fafce1eb9674f2`
- **Demo video script:** [VIDEO_WALKTHROUGH.md](VIDEO_WALKTHROUGH.md)
- **Exact setup and commands:** [setup.md](setup.md)
- **Technical/component notes:** [docs/technical](docs/technical/README.md)

## Architecture in one paragraph

The Next.js client keeps the credential, date of birth, salt, issuer secret, and holder secret on the user's device. It asks Lace to prove the Compact contract's age rule locally and sends only a transaction identifier and a context-bound nullifier to the Express access gate. The access gate reads Midnight Preprod through the Indexer and unlocks chat only when the matching nullifier is present in contract state; it never receives the date of birth or the credential's secret values.

```text
Credential + DOB + secret witnesses (browser only)
                    │ ZK proof via Lace / local proof server
                    ▼
       Guardian Rail Compact contract (Midnight Preprod)
                    │ public commitment + context-specific nullifier
                    ▼
             Midnight Indexer ──► Express access gate ──► AI chat unlock
```

## Why Midnight / what stays private

Midnight is the enforcement layer because the policy can be checked in a zero-knowledge circuit. The public contract ledger stores the issuer-key commitment, age-policy cutoff, credential commitments, and spent nullifiers. It does **not** store a DOB, government ID, selfie, name, credential salt, issuer secret, or holder secret. A nullifier is unique to the chat session and policy version, which prevents replay without becoming a permanent identity.

## What is working

- Compact contract compiles with the installed Compact toolchain.
- A Guardian Rail contract is deployed to Midnight Preprod at the address above.
- Next.js frontend connects to Lace, uses the wallet's Preprod configuration, and obtains proving assets through the local proof server.
- Local issuer credentials can be registered through the issuer-authorized `registerCredential` circuit.
- `proveAge` is a real on-chain transaction; the backend checks Preprod Indexer state before unlocking the chat.
- The hosted Preprod Indexer's `offset: null` issue is handled explicitly in the frontend and backend state readers.

## Five-minute local run

```bash
npm install
copy apps\backend\.env.example apps\backend\.env
copy apps\frontend\.env.example apps\frontend\.env
npm run env:up
npm run dev:backend
npm run dev:frontend

npm run issuer:generate-keypair --workspace=@guardian-rail/middleware
npm run issuer:issue --workspace=@guardian-rail/middleware
```

Open `http://localhost:3000`. For the live Preprod flow, follow [setup.md](setup.md): it covers Lace, tDUST, environment values, registration, and proof confirmation.

## Build and compile evidence

```bash
npm run typecheck
npm run build
```

Compile the contract in Ubuntu/WSL:

```bash
cd /mnt/c/Arpit/Coding/Guardian-Rail/contracts/guardian-rail
mkdir -p managed/guardian-rail
compact compile src/guardian-rail.compact managed/guardian-rail
```

The compiled output is written beneath `managed/guardian-rail/` and intentionally ignored by Git because it contains generated proving material. The contract was compiled and the frontend/backend production builds were verified during submission preparation.

## Current limits and honest next steps

This is a hackathon prototype, not a production age-verification service.

- A local mock issuer is used; production requires a real issuer and a security-reviewed attestation design.
- Credential expiry and revocation are not implemented.
- The contract currently uses a public `Set` of credential commitments. A production design should assess a Merkle-based membership approach for a stronger anonymity set.
- Sessions are in memory; production needs durable storage, authentication, rate limiting, monitoring, recovery, and security/privacy/legal review.
- The live registration/proof demonstration requires Preprod tDUST. DUST is generated gradually by registered tNIGHT and cannot be transferred directly.

## Repository map

```text
apps/frontend/                 Next.js + Lace user experience
apps/backend/                  Express access gate and local mock issuer
contracts/guardian-rail/       Compact source and generated build output
infra/                         Docker Compose proof-server configuration
docs/technical/                Component-level technical documentation
docs/submission/               Submission support material
```

The root README is intentionally submission-focused. See [docs/technical](docs/technical/README.md) for the moved component notes and [remaining-work.md](remaining-work.md) for the implementation backlog.
