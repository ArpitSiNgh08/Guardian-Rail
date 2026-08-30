import { ed25519 } from '@noble/curves/ed25519.js';

export interface MockCredential {
  birthdate: string;
  signature: Uint8Array;
}

/**
 * Hackathon-only helper for producing locally held test credentials.
 * Do not expose this as a public API in production.
 */
export function signMockCredential(birthdate: string, issuerPrivateKey: Uint8Array): MockCredential {
  const payload = new TextEncoder().encode(`guardian-rail:birthdate:${birthdate}`);
  return { birthdate, signature: ed25519.sign(payload, issuerPrivateKey) };
}
