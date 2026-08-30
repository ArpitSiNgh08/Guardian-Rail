# Local infrastructure

Start the local Midnight proof server:

```bash
docker compose --env-file .env.example up -d
```

It listens at `http://localhost:6300`. Configure Lace Midnight Preview to use
that local proof-server endpoint.

The official Midnight node and Indexer endpoints/devnet configuration will be
added after the Compact toolchain is installed. Midnight's current Windows
guidance recommends using WSL for contract development.
