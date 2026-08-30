# Guardian Rail Progress

Updated: 2026-08-30

## Completed

- Established the npm workspace monorepo layout.
- Migrated the frontend to Next.js App Router.
- Added the local privacy-demo flow: DOB is evaluated in the browser and is
  not sent to the backend.
- Added the Express middleware with in-memory sessions and one-time demo
  nullifiers.
- Added the server-only Ed25519 mock credential issuer and CLI.
- Added Docker Compose configuration for the local Midnight proof server on
  port `6300`.
- Installed WSL/Ubuntu and Compact toolchain `0.31.1` (language version
  `0.23.0`).
- Added the initial Compact contract with issuer-authorized credential
  registration, age policy checks, policy versioning, and context-specific
  nullifiers.
- Extended mock credentials with a signed 32-byte salt required for Compact
  credential commitments.
- Added browser-side credential validation, epoch-day conversion, holder-secret
  storage, and generated-contract-compatible user witness callbacks.
- Connected local credential JSON selection to the frontend; the browser now
  parses the credential locally and uses its DOB for the demo eligibility check.
- Added a compiled-contract adapter using Midnight.js `CompiledContract`, the
  generated Guardian Rail contract, local witnesses, and compiled asset path.
- Added browser wallet discovery and Preprod connection UX through the Midnight
  DApp Connector API, including public unshielded-address display.
- Added a wallet configuration preflight that verifies Preprod and reads the
  wallet-provided Indexer and node endpoints before live transactions.
- Added a constrained Next.js route for serving compiled ZK assets and a
  browser `FetchZkConfigProvider` factory; the local `proveAge` ZKIR endpoint
  responds successfully.
- Added Lace-backed proving, transaction-balancing, finalization, and submit
  adapters for Midnight.js.
- Added a Preprod deployment button that receives only a derived issuer-key
  commitment from the local backend and sends the deployment transaction to
  Lace for user approval.
- Added wallet DUST-balance capture and display so live transaction readiness is
  visible before deployment or proof submission.
- Compiled the Compact contract successfully to `contracts/guardian-rail/managed/`.
- Added the live `proveAge` transaction flow and replaced runtime demo
  verification with Indexer state/transaction confirmation.
- Verified the backend/frontend typecheck and production builds after the live
  integration changes.
- Added backend acceptance tests for session isolation and nullifier replay
  protection; backend typecheck passes. Test execution is currently blocked by
  a Node.js host resource error (`uv_os_get_passwd ... ENOMEM`).
- Deployed Guardian Rail to Midnight Preprod at
  `615262496a6e09fd689829387af7c11b814c1f6a0c31fb6a91fafce1eb9674f2`.
- Stored the deployed address in the ignored frontend/backend environments,
  configured the Preprod Indexer v4 endpoint, and disabled backend demo mode.
- Added a local issuer registration flow that keeps `issuer-keypair.json` in
  browser memory, proves issuer authorization, submits through Lace, and waits
  for on-chain confirmation.

## Current state

The contract is deployed and both applications are configured for live
Preprod/Indexer operation. The browser can now register the selected local
credential commitment through an issuer-authorized Lace transaction.

## Next milestone

Register `credential-v2.json` using the matching local issuer keypair, submit a
real `proveAge` transaction, and confirm that the backend unlocks chat only
after the Indexer observes the finalized nullifier.
