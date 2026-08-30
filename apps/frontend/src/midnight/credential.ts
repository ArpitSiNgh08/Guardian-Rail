export interface LocalCredential {
  readonly version: 1;
  readonly issuerPublicKeyHex: string;
  readonly birthdate: string;
  readonly saltHex: string;
  readonly issuedAt: string;
  readonly signatureHex: string;
}

export interface LocalIssuerKeyPair {
  readonly privateKeyHex: string;
  readonly publicKeyHex: string;
}

const HEX_32_BYTES = /^[0-9a-f]{64}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
}

export function parseLocalCredential(value: unknown): LocalCredential {
  if (!isRecord(value)
    || value.version !== 1
    || typeof value.issuerPublicKeyHex !== 'string'
    || typeof value.birthdate !== 'string'
    || typeof value.saltHex !== 'string'
    || typeof value.issuedAt !== 'string'
    || typeof value.signatureHex !== 'string'
    || !HEX_32_BYTES.test(value.issuerPublicKeyHex)
    || !HEX_32_BYTES.test(value.saltHex)
    || !HEX_32_BYTES.test(value.signatureHex.slice(0, 64))
    || value.signatureHex.length !== 128
    || !isIsoDate(value.birthdate)) {
    throw new Error('Invalid local credential.');
  }

  return value as unknown as LocalCredential;
}

export function parseLocalIssuerKeyPair(value: unknown): LocalIssuerKeyPair {
  if (!isRecord(value)
    || typeof value.privateKeyHex !== 'string'
    || typeof value.publicKeyHex !== 'string'
    || !HEX_32_BYTES.test(value.privateKeyHex)
    || !HEX_32_BYTES.test(value.publicKeyHex)) {
    throw new Error('Invalid local issuer keypair.');
  }
  return value as unknown as LocalIssuerKeyPair;
}

export function birthdateToEpochDays(birthdate: string): bigint {
  if (!isIsoDate(birthdate)) throw new Error('Birthdate must use YYYY-MM-DD.');
  return BigInt(Math.floor(Date.parse(`${birthdate}T00:00:00.000Z`) / 86_400_000));
}

export function hexToBytes(value: string, expectedBytes = 32): Uint8Array {
  if (!new RegExp(`^[0-9a-f]{${expectedBytes * 2}}$`, 'i').test(value)) {
    throw new Error(`Expected ${expectedBytes} bytes encoded as hexadecimal.`);
  }
  const bytes = new Uint8Array(expectedBytes);
  for (let index = 0; index < expectedBytes; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export function getOrCreateHolderSecret(storage: Storage, key = 'guardian-rail-holder-secret') {
  const existing = storage.getItem(key);
  if (existing) return hexToBytes(existing);
  const secret = new Uint8Array(32);
  crypto.getRandomValues(secret);
  const encoded = Array.from(secret, (byte) => byte.toString(16).padStart(2, '0')).join('');
  storage.setItem(key, encoded);
  return secret;
}
