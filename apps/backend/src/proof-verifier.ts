export interface ProofSubmission {
  sessionId: string;
  contextId: string;
  nullifier: string;
  disclosed: boolean;
}

export interface ProofVerifier {
  verify(submission: ProofSubmission): Promise<boolean>;
}

/**
 * Development-only verifier. It deliberately receives no date of birth,
 * credential, issuer signature, or user secret. Replace this with an Indexer
 * verifier before any non-demo deployment.
 */
export class DemoProofVerifier implements ProofVerifier {
  async verify(submission: ProofSubmission): Promise<boolean> {
    return submission.disclosed && /^[a-f0-9]{64}$/i.test(submission.nullifier);
  }
}
