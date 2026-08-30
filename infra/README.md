# Local infrastructure

Start the local Midnight proof server:

```bash
docker compose --env-file .env.example up -d
```

It listens at `http://localhost:6300`. Configure Lace Midnight **Preprod** to
use that local proof-server endpoint when working against Preprod.

This is a browser/Lace proof-generation service; it is not the backend's
Indexer. The backend will receive a separate Indexer URL and deployed contract
address after the contract is deployed. Use WSL for Compact development on
Windows.
