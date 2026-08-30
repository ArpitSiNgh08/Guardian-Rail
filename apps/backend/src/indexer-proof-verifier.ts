import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import type { ProofSubmission, ProofVerifier } from './proof-verifier.js';

const generatedContractUrl = new URL(
  '../../../contracts/guardian-rail/managed/guardian-rail/contract/index.js',
  import.meta.url,
).href;

function hexToBytes(hex: string) {
  return Uint8Array.from(hex.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
}

/** Confirms that the submitted nullifier is present in the deployed contract state. */
export class IndexerProofVerifier implements ProofVerifier {
  private readonly provider;
  constructor(private readonly contractAddress: string, indexerUrl: string) {
    const wsUrl = indexerUrl.replace(/^http/, 'ws');
    this.provider = indexerPublicDataProvider(indexerUrl, wsUrl);
  }

  async verify(submission: ProofSubmission): Promise<boolean> {
    if (submission.transactionId) await this.provider.watchForTxData(submission.transactionId);
    const state = await this.provider.queryContractState(this.contractAddress);
    if (!state) return false;
    const guardianRailContract = await import(generatedContractUrl);
    const contractLedger = guardianRailContract.ledger((state as ContractState).data);
    return contractLedger.spentNullifiers.member(hexToBytes(submission.nullifier));
  }
}
