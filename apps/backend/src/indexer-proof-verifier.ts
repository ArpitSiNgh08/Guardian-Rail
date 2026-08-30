import { ContractState } from '@midnight-ntwrk/compact-runtime';
import type { ProofSubmission, ProofVerifier } from './proof-verifier.js';

const generatedContractUrl = new URL(
  '../../../contracts/guardian-rail/managed/guardian-rail/contract/index.js',
  import.meta.url,
).href;

function hexToBytes(hex: string) {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (!/^[0-9a-f]+$/i.test(normalized) || normalized.length % 2 !== 0) throw new Error('Indexer returned invalid hexadecimal state.');
  return Uint8Array.from(normalized.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/** Confirms that the submitted nullifier is present in the deployed contract state. */
export class IndexerProofVerifier implements ProofVerifier {
  constructor(private readonly contractAddress: string, private readonly indexerUrl: string) {}

  private async latestContractState(): Promise<ContractState | null> {
    // Do not use the SDK's default query here: Preview/Preprod reject its
    // `offset: null` request. This query intentionally omits `offset`.
    const response = await fetch(this.indexerUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `query LatestState($address: HexEncoded!) {
          contractAction(address: $address) { state }
        }`,
        variables: { address: this.contractAddress },
      }),
    });
    if (!response.ok) throw new Error(`Midnight Indexer returned HTTP ${response.status}.`);
    const payload = await response.json() as {
      data?: { contractAction?: { state?: string } | null };
      errors?: Array<{ message?: string }>;
    };
    if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message ?? 'Unknown Indexer error').join('; '));
    const state = payload.data?.contractAction?.state;
    return state ? ContractState.deserialize(hexToBytes(state)) : null;
  }

  async verify(submission: ProofSubmission): Promise<boolean> {
    const guardianRailContract = await import(generatedContractUrl);
    // Chain finality and Indexer availability are asynchronous. Poll for a
    // bounded period and unlock only if this exact nullifier reaches contract
    // state; a submitted wallet transaction alone never grants access.
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const state = await this.latestContractState();
      if (state) {
        const contractLedger = guardianRailContract.ledger(state.data);
        if (contractLedger.spentNullifiers.member(hexToBytes(submission.nullifier))) return true;
      }
      await wait(2_000);
    }
    return false;
  }
}
