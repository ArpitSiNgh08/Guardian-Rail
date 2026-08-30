# Guardian Rail

Guardian Rail is a privacy-preserving age and consent gate for AI chat apps.
It is designed to let a platform receive a proof result without collecting a
birthdate, government ID, or selfie.

## Repository layout

- `apps/frontend` — Next.js App Router proof flow and protected chat UI.
- `apps/backend` — Express access gate, session handling, and mock issuer helper.
- `contracts/guardian-rail` — the independently deployed Midnight Compact contract.
- `infra` — local node, proof server, and indexer configuration.

## Run the current demo

1. Copy `apps/backend/.env.example` to `apps/backend/.env`.
2. Copy `apps/frontend/.env.example` to `apps/frontend/.env`.
3. In one terminal, run `npm run dev:backend`.
4. In another terminal, run `npm run dev:frontend`.

The current vertical slice uses an explicit demo verifier. The browser checks a
DOB locally and sends only a context-bound nullifier plus a boolean result. It
is not yet a real Midnight ZK proof and must not be used as a production age
gate until the Compact contract and Indexer verifier replace the demo adapter.

## Verification

Run `npm run typecheck` and `npm run build` from the repository root.
