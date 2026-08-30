# Local infrastructure

Start the local Midnight proof server from the repository root:

```bash
npm run env:up
```

It listens on `http://localhost:6300`. Configure Lace Midnight **Preprod** to use this local proof-server endpoint. It creates proofs locally in the wallet; it is not the backend's Indexer endpoint.

Check status and stop it with:

```bash
docker compose --env-file infra/.env.example -f infra/docker-compose.yml ps
npm run env:down
```
