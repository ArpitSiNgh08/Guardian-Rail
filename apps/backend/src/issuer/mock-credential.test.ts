import assert from 'node:assert/strict';
import test from 'node:test';
import { generateIssuerKeyPair, issueMockCredential, verifyMockCredential } from './mock-credential.js';

test('issues and verifies a signed mock credential', () => {
  const issuer = generateIssuerKeyPair();
  const credential = issueMockCredential('2000-02-29', issuer.privateKeyHex, '2026-08-30T00:00:00.000Z');
  assert.equal(verifyMockCredential(credential), true);
  assert.equal(verifyMockCredential({ ...credential, birthdate: '2001-02-28' }), false);
});
