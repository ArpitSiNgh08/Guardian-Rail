# Guardian Rail video walkthrough script

**Target length: 2.5–3 minutes.** Record with the browser, Lace, and one terminal visible. Do not show credentials, private keys, or `.env` files.

## 0:00–0:20 — Problem and promise

> AI chat services often ask for a birth date, ID, or selfie to enforce an age policy. Guardian Rail proves eligibility instead of identity. The platform receives only a yes/no access decision, never the user's date of birth.

Show the locked Guardian Rail page.

## 0:20–0:45 — Architecture and privacy boundary

> The credential, birth date, salt, and holder secret stay in the browser as private witnesses. Lace generates a Midnight proof locally. The contract stores only a credential commitment and a session-specific nullifier. Our Express gate unlocks the chat only after the Midnight Indexer confirms that nullifier on Preprod.

Show the architecture diagram in the root README, then return to the app.

## 0:45–1:05 — Compile evidence

> This is a real Compact contract, not a simulated blockchain screen. In WSL, this command compiles `guardian-rail.compact` into its managed ZK artifacts.

```bash
cd /mnt/c/Arpit/Coding/Guardian-Rail/contracts/guardian-rail
compact compile src/guardian-rail.compact managed/guardian-rail
```

Briefly show the generated `managed/guardian-rail/` folders. Do not linger on key files.

## 1:05–1:30 — Preprod and wallet readiness

> Lace is connected to Midnight Preprod with the local proof server. This deployed contract address is the Guardian Rail contract on Preprod. The wallet must have available tDUST because Midnight transactions consume DUST for fees.

Show Lace network settings, proof server `http://localhost:6300`, then the connected-address and deployed-contract UI. Avoid showing seed phrases.

## 1:30–2:05 — Credential registration

> I select a locally issued test credential and its matching issuer keypair. The issuer secret is used locally only to authorize registration. Lace asks for one transaction approval. Guardian Rail does not treat the popup as proof of success—it waits until the Preprod Indexer confirms the commitment in contract state.

Select the two JSON files, click **Register credential on-chain**, approve once in Lace, and show **Credential registration confirmed on-chain**. If tDUST is still refilling, use a pre-recorded confirmed state and say so.

## 2:05–2:40 — Private age proof and gated unlock

> Now I generate a private proof. The birth date remains local; the on-chain result is only a context-specific nullifier. The backend polls the Midnight Indexer and unlocks chat only after it sees this exact nullifier in the contract's spent-nullifier set. Reusing the same proof context is rejected.

Click **Generate private proof**, approve in Lace, then show **Access granted** and the unlocked companion chat.

## 2:40–3:00 — Honest limits and next steps

> This prototype proves the end-to-end privacy boundary and Preprod path. For production we will replace the mock issuer, add expiry and revocation, move to durable sessions and operational controls, and complete security, privacy, and legal review.

End on the README's “Current limits and honest next steps” section.
