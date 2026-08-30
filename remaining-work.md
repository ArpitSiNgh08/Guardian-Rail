# Guardian Rail Remaining Work

This is the implementation checklist after the local demo and initial Compact
contract compilation.

## 1. Validate the Compact contract

- [ ] Add TypeScript witness implementations.
- [ ] Add local contract tests.
- [ ] Test valid registered credentials.
- [ ] Test underage credentials.
- [ ] Test unregistered credentials.
- [ ] Test an incorrect issuer secret.
- [ ] Test reused nullifiers.
- [ ] Test different contexts and policy versions.
- [ ] Review disclosure and privacy behavior.
- [ ] Confirm generated artifacts remain ignored by Git.

## 2. Complete the credential flow

- [ ] Define the credential format and serialization rules.
- [ ] Connect mock issuer credentials to Compact witnesses.
- [ ] Register credential commitments on-chain.
- [ ] Confirm issuer authorization works.
- [ ] Remove reliance on a self-entered DOB for the real flow.
- [ ] Add credential expiry and revocation.
- [ ] Replace the mock issuer with a real trusted credential provider before
  production.

## 3. Integrate Lace or 1AM

- [ ] Add DApp Connector integration.
- [ ] Detect, connect, and disconnect the wallet.
- [ ] Confirm the wallet is on Midnight Preprod.
- [ ] Configure the local proof server at `http://localhost:6300`.
- [ ] Generate a real proof locally.
- [x] Submit a real Compact transaction through the Lace adapter.
- [ ] Display wallet, proving, submission, confirmation, and error states.
- [ ] Handle rejected transactions and insufficient funds.

## 4. Deploy to Preprod

- [x] Add a Lace-backed deployment control in the frontend.
- [ ] Fund the deployment wallet with Preprod tDUST.
- [ ] Deploy the compiled contract (requires Lace confirmation).
- [ ] Record the deployed contract address.
- [ ] Configure the frontend and backend with the address.
- [ ] Confirm deployed state through the Indexer.

## 5. Replace the demo verifier

- [ ] Configure the Midnight Indexer URL.
- [x] Replace runtime `DemoProofVerifier` with Indexer-backed verification.
- [x] Wait for the submitted transaction and verify contract state through the Indexer.
- [ ] Verify the context-specific nullifier and policy version.
- [ ] Reject invalid, expired, revoked, and replayed proofs.
- [ ] Add retry and timeout handling for Indexer confirmation delays.
- [ ] Stop trusting client-supplied demo fields such as `disclosed: true`.

## 6. End-to-end acceptance tests

- [x] Locked chat becomes unlocked only after Indexer confirmation.
- [ ] Underage proof is rejected.
- [ ] Unregistered credential is rejected.
- [ ] Invalid issuer is rejected.
- [ ] Expired credential is rejected.
- [ ] Revoked credential is rejected.
- [ ] Replayed proof is rejected.
- [ ] Different contexts produce different nullifiers.
- [ ] DOB is absent from requests, logs, and public ledger state.

## 7. Production readiness

- [ ] Replace the mock issuer and perform a security-reviewed attestation
  design.
- [ ] Add durable session storage.
- [ ] Add authentication, authorization, and rate limiting.
- [ ] Secure issuer and deployment keys.
- [ ] Define wallet recovery behavior.
- [ ] Add monitoring without logging private credential data.
- [ ] Implement parental consent if required by the target policy.
- [ ] Define retention and deletion rules.
- [ ] Complete security, privacy, and legal reviews.

## 8. Documentation and release preparation

- [ ] Keep architecture diagrams synchronized with the deployed topology.
- [ ] Document Preprod deployment and rollback procedures.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `npm test --workspace=@guardian-rail/middleware`.
- [ ] Prepare a clean local demo script.
- [ ] Prepare a Preprod demo script and replay-attack demonstration.
- [ ] Record a backup demo video.
