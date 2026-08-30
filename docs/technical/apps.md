# Applications

Guardian Rail has two runnable application workspaces:

- `apps/frontend/` — Next.js App Router user interface, credential handling, Lace integration, and local proof preparation.
- `apps/backend/` — Express access gate, local sessions, Indexer-backed proof verification, and the hackathon-only mock credential issuer.

The Compact contract is independently deployed from `contracts/guardian-rail/`; it is not part of the backend HTTP deployment artifact.
