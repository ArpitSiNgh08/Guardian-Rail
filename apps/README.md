# Applications

This directory contains the two runnable sides of Guardian Rail:

- `frontend/` — Next.js App Router user interface and wallet interaction.
- `backend/` — Node/Express middleware that queries the Midnight indexer and
  controls chatbot access.

The backend also contains the server-only mock issuer:

- `backend/src/issuer/` — hackathon-only mock credential issuer.

The independently deployed Compact contract lives under `../contracts/`.
