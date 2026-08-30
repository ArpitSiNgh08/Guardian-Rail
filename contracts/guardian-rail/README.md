# Guardian Rail Compact Contract

This directory is intentionally separate from the backend service.

The contract is compiled to a Compact artifact and deployed through a signed
transaction to the Midnight network. Its deployed address is then supplied to
the frontend and backend through environment configuration. The backend never
deploys as part of its own HTTP-service deployment; it queries the indexer and
enforces access using the already-deployed contract state.

## Current contents

- `src/guardian-rail.compact` — the Compact v0 age-policy contract.

The contract stores the issuer-key commitment, a public age-policy cutoff and
version, issued credential commitments, and spent context-specific nullifiers.
Its `proveAge` circuit reads the birth date, credential salt, and holder secret
as local witnesses. It confirms that the resulting credential commitment was
registered by the issuer, checks the cutoff, and discloses only the generated
nullifier.

## Compile in WSL

From the repository root in Ubuntu:

```bash
cd /mnt/c/Arpit/Coding/Guardian-Rail/contracts/guardian-rail
mkdir -p managed/guardian-rail
compact compile src/guardian-rail.compact managed/guardian-rail
```

`managed/` contains generated proving keys and TypeScript artifacts. It is a
build output and should not be committed.

## Important limitation

This first contract makes the issuer's on-chain credential registration the
source of trust. The existing backend mock issuer and its Ed25519 signature are
not wired into the circuit yet. Before production, replace per-credential
registration with a properly designed issuer attestation/credential scheme,
including revocation and expiry, and perform a security review.
