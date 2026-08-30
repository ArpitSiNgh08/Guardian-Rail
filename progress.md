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
- Compiled the Compact contract successfully to `contracts/guardian-rail/managed/`.
- Verified the backend, frontend, typecheck/build flow, and local browser demo.
- Added backend acceptance tests for session isolation and nullifier replay
  protection; backend typecheck passes. Test execution is currently blocked by
  a Node.js host resource error (`uv_os_get_passwd ... ENOMEM`).

## Current state

The local demo works end to end, but it uses `DemoProofVerifier`. It is not yet
a deployed Midnight DApp and does not yet generate or submit a real Compact
proof.

## Next milestone

Resolve the local test-runner resource issue, then implement and test Compact
witness functions before connecting the generated contract package to Lace and
real proof generation.
