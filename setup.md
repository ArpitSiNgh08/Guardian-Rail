# Guardian Rail setup

This guide gets a reviewer from clone to the local UI, and then optionally to the live Midnight Preprod flow.

## Prerequisites

- Node.js 20–22 and npm 10+
- Docker Desktop
- Ubuntu on WSL 2 (Windows only) with Compact installed
- Lace Wallet set to **Midnight → Preprod**

## 1. Install and configure

From the repository root in PowerShell:

```powershell
npm install
copy apps\backend\.env.example apps\backend\.env
copy apps\frontend\.env.example apps\frontend\.env
npm run env:up
```

The Docker proof server should be running on `http://localhost:6300`:

```powershell
docker compose --env-file infra/.env.example -f infra/docker-compose.yml ps
```

In Lace's Midnight settings, choose **Preprod** and set the proof server to **Local** at `http://localhost:6300`.

## 2. Run the local application

In two terminals at the repository root:

```powershell
npm run dev:backend
npm run dev:frontend
```

Open `http://localhost:3000`. The backend health endpoint is `http://localhost:4000/health`.

## 3. Compile the Compact contract

Run this in Ubuntu/WSL, not PowerShell:

```bash
cd /mnt/c/Arpit/Coding/Guardian-Rail/contracts/guardian-rail
mkdir -p managed/guardian-rail
compact compile src/guardian-rail.compact managed/guardian-rail
```

## 4. Configure the existing Preprod contract

The project currently targets this deployed contract:

```text
615262496a6e09fd689829387af7c11b814c1f6a0c31fb6a91fafce1eb9674f2
```

For live verification, set these local-only values:

```dotenv
# apps/backend/.env
DEMO_MODE=false
MIDNIGHT_INDEXER_URL=https://indexer.preprod.midnight.network/api/v4/graphql
MIDNIGHT_CONTRACT_ADDRESS=615262496a6e09fd689829387af7c11b814c1f6a0c31fb6a91fafce1eb9674f2
```

```dotenv
# apps/frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GUARDIAN_RAIL_CONTRACT_ADDRESS=615262496a6e09fd689829387af7c11b814c1f6a0c31fb6a91fafce1eb9674f2
```

Restart both development servers after changing environment files.

## 5. Issue and register a local test credential

```powershell
npm run issuer:generate-keypair --workspace=@guardian-rail/middleware
npm run issuer:issue --workspace=@guardian-rail/middleware -- 2000-01-01
```

In the browser, connect Lace, select the generated `credential-v2.json` and matching `issuer-keypair.json`, then choose **Register credential on-chain**. Wait for **Credential registration confirmed on-chain** before generating an age proof.

## 6. tDUST readiness

Lace pays Preprod transaction fees with tDUST. Use the DUST control in Lace to register your tNIGHT, then wait for it to generate tDUST. This is gradual: tDUST is not transferable and sending tNIGHT does not create it instantly. Do not attempt deployment, credential registration, or proof submission while Lace reports **tDUST Tank Empty**.

## 7. Verify

```powershell
npm run typecheck
npm run build
```

For the full judge-facing flow, use [VIDEO_WALKTHROUGH.md](VIDEO_WALKTHROUGH.md).
