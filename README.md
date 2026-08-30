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

The repository contains a working **local demo flow**, not yet a real Midnight
proof implementation.

1. The Next.js browser client creates a private access session.
2. The user enters a DOB, which is evaluated only in the browser.
3. The browser generates a context-bound demo nullifier and submits that plus
   the disclosed boolean; it does not submit the DOB.
4. The Express backend unlocks the protected chat and rejects a reused
   nullifier.

The demo demonstrates the intended privacy boundary, session lifecycle, and
replay protection UX. It must not be used as a production age-verification
system until the Compact contract, local proof generation, and Indexer-backed
verification are complete.

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

### Required for a real Midnight proof

- Implement the Compact contract: issuer-key commitment, age assertion,
  `disclose(true)`, policy versioning, and spent-nullifier set.
- Add local witness functions that read a signed credential and user secret
  without exposing either to the backend.
- Add the mock issuer CLI and credential storage format for local development.
- Configure a local Midnight node and Indexer (the proof-server Compose setup is ready).
- Replace `DemoProofVerifier` with an Indexer-backed verifier that checks the
  deployed contract state.
- Add Lace/1AM DApp Connector integration and transaction/proof status UX.
- Add Compact compile, test, and testnet deployment scripts.

### Required before production

- Integrate a real credential issuer/KYC or government eID provider.
- Decide credential expiry, revocation, parental-consent, and recovery flows.
- Add authentication, durable session storage, rate limiting, and monitoring.
- Carry out security, privacy, and legal review before processing real users.
