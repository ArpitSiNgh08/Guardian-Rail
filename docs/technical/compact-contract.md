# Guardian Rail Compact contract

Source: `contracts/guardian-rail/src/guardian-rail.compact`.

The contract stores an issuer-key commitment, public policy cutoff and version, credential commitments, and spent context-specific nullifiers. `proveAge` receives the birth date, salt, and holder secret as browser-side witnesses. It checks registered membership and the age rule, then discloses only the context-bound nullifier.

Compile from Ubuntu/WSL:

```bash
cd /mnt/c/Arpit/Coding/Guardian-Rail/contracts/guardian-rail
mkdir -p managed/guardian-rail
compact compile src/guardian-rail.compact managed/guardian-rail
```

`managed/` is generated output and is ignored by Git.

The local mock issuer's Ed25519 signature is not verified inside the first contract version. Instead, issuer-authorized on-chain registration is the current trust boundary. Production requires a reviewed attestation, expiry, and revocation scheme.
