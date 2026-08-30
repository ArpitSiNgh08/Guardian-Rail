# Guardian Rail Compact Contract

This directory is intentionally separate from the backend service.

The contract is compiled to a Compact artifact and deployed through a signed
transaction to the Midnight network. Its deployed address is then supplied to
the frontend and backend through environment configuration. The backend never
deploys as part of its own HTTP-service deployment; it queries the indexer and
enforces access using the already-deployed contract state.

Planned contents:

- `src/` — Compact circuits and ledger declarations.
- `witnesses/` — local witness definitions.
- `scripts/` — compile and deploy helpers.
