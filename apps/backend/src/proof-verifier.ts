export interface ProofSubmission {
  sessionId: string;
  contextId: string;
  nullifier: string;
  transactionId?: string;
  disclosed: boolean;
}

export interface ProofVerifier {
  verify(submission: ProofSubmission): Promise<boolean>;
}

/** Retained only for isolated development tests; production wiring must not use it. */
export class DemoProofVerifier implements ProofVerifier {
  async verify(submission: ProofSubmission): Promise<boolean> {
    return submission.disclosed && /^[a-f0-9]{64}$/i.test(submission.nullifier);
  }
}
