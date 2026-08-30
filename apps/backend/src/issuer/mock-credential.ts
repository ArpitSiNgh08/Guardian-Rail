import { ed25519 } from '@noble/curves/ed25519.js';
import { randomBytes } from 'node:crypto';

export const CREDENTIAL_VERSION = 1;

export interface IssuerKeyPair { readonly privateKeyHex: string; readonly publicKeyHex: string; }
export interface MockCredential {
  readonly version: typeof CREDENTIAL_VERSION;
  readonly issuerPublicKeyHex: string;
  readonly birthdate: string;
  readonly saltHex: string;
  readonly issuedAt: string;
  readonly signatureHex: string;
}

const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');
const fromHex = (value: string) => new Uint8Array(Buffer.from(value, 'hex'));

function assertBirthdate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Birthdate must use YYYY-MM-DD.');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Birthdate must be valid.');
}

function payload(input: Omit<MockCredential, 'signatureHex'>) {
  return new TextEncoder().encode(JSON.stringify({
    version: input.version, issuerPublicKeyHex: input.issuerPublicKeyHex,
    birthdate: input.birthdate, saltHex: input.saltHex, issuedAt: input.issuedAt,
  }));
}

export function generateIssuerKeyPair(): IssuerKeyPair {
  const privateKey = ed25519.utils.randomSecretKey();
  return { privateKeyHex: toHex(privateKey), publicKeyHex: toHex(ed25519.getPublicKey(privateKey)) };
}

export function issueMockCredential(birthdate: string, privateKeyHex: string, issuedAt = new Date().toISOString()): MockCredential {
  assertBirthdate(birthdate);
  const privateKey = fromHex(privateKeyHex);
  if (privateKey.length !== 32) throw new Error('An Ed25519 private key must be 32 bytes.');
  const unsignedCredential = {
    version: CREDENTIAL_VERSION,
    issuerPublicKeyHex: toHex(ed25519.getPublicKey(privateKey)),
    birthdate,
    saltHex: randomBytes(32).toString('hex'),
    issuedAt,
  } as const;
  return { ...unsignedCredential, signatureHex: toHex(ed25519.sign(payload(unsignedCredential), privateKey)) };
}

export function verifyMockCredential(credential: MockCredential): boolean {
  try {
    assertBirthdate(credential.birthdate);
    const publicKey = fromHex(credential.issuerPublicKeyHex);
    const salt = fromHex(credential.saltHex);
    const signature = fromHex(credential.signatureHex);
    return credential.version === CREDENTIAL_VERSION && publicKey.length === 32 && salt.length === 32 && signature.length === 64 && ed25519.verify(signature, payload(credential), publicKey);
  } catch { return false; }
}
