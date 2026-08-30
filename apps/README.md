# Applications

This directory contains the two runnable sides of Guardian Rail:

- `frontend/` — Next.js App Router user interface and wallet interaction.
- `backend/` — Node/Express middleware that controls chatbot access. It uses a
  local demo verifier today; after deployment it will query the Midnight
  Indexer instead.

The backend also contains the server-only mock issuer:

- `backend/src/issuer/` — hackathon-only mock credential issuer.

The independently deployed Compact contract lives under `../contracts/` and is
not part of the backend deployment artifact.
