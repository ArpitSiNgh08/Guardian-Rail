import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { generateIssuerKeyPair, issueMockCredential, type IssuerKeyPair } from './mock-credential.js';

const [command, ...args] = process.argv.slice(2);
async function save(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
}
async function main() {
  if (command === 'generate-keypair') {
    const output = args[0] ?? 'credentials/issuer-keypair.json';
    await save(output, generateIssuerKeyPair());
    console.log(`Saved mock issuer keypair to ${output}. Keep it local.`);
    return;
  }
  if (command === 'issue') {
    const [birthdate, keyPath = 'credentials/issuer-keypair.json', output = 'credentials/credential.json'] = args;
    if (!birthdate) throw new Error('Usage: issuer:issue -- <YYYY-MM-DD> [key-path] [output-path]');
    const keypair = JSON.parse(await readFile(keyPath, 'utf8')) as IssuerKeyPair;
    await save(output, issueMockCredential(birthdate, keypair.privateKeyHex));
    console.log(`Saved private test credential to ${output}. Do not commit it.`);
    return;
  }
  throw new Error('Usage: issuer:generate-keypair [output-path] | issuer:issue <YYYY-MM-DD> [key-path] [output-path]');
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
