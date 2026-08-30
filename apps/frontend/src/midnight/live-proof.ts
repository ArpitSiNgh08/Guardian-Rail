import { createUnprovenCallTx, getPublicStates, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { pureCircuits } from '../../../../contracts/guardian-rail/managed/guardian-rail/contract/index.js';
import { createGuardianRailContract } from './contract';
import { getOrCreateHolderSecret, hexToBytes, type LocalCredential } from './credential';
import { createLaceMidnightProvider, createLaceProofProvider, createLacePublicDataProvider, createLaceWalletProvider } from './lace-providers';
import { createGuardianRailZkConfigProvider } from './zk-config';

function hexToByteArray(value: string) {
  return hexToBytes(value);
}

export async function submitLiveAgeProof(wallet: ConnectedAPI, credential: LocalCredential, contextId: string) {
  const contractAddress = process.env.NEXT_PUBLIC_GUARDIAN_RAIL_CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error('The deployed Guardian Rail contract address is not configured.');
  const [addresses, configuration] = await Promise.all([wallet.getShieldedAddresses(), wallet.getConfiguration()]);
  const publicDataProvider = createLacePublicDataProvider(configuration);
  const providers = {
    publicDataProvider,
    zkConfigProvider: createGuardianRailZkConfigProvider(),
    proofProvider: await createLaceProofProvider(wallet),
    walletProvider: createLaceWalletProvider(wallet, {
      coin: addresses.shieldedCoinPublicKey,
      encryption: addresses.shieldedEncryptionPublicKey,
    }),
    midnightProvider: createLaceMidnightProvider(wallet),
  } as never;
  const compiledContract = createGuardianRailContract(localStorage, credential);
  const states = await getPublicStates(publicDataProvider, contractAddress);
  const tx = await createUnprovenCallTx(providers, {
    compiledContract,
    circuitId: 'proveAge',
    contractAddress,
    args: [hexToByteArray(contextId)],
    ...states,
  } as never);
  const transactionId = await submitTxAsync(providers, { unprovenTx: tx.private.unprovenTx, circuitId: 'proveAge' });
  const nullifier = pureCircuits.nullifierFor(hexToByteArray(contextId), getOrCreateHolderSecret(localStorage), 1n);
  return {
    transactionId,
    nullifier: Array.from(nullifier, (byte) => byte.toString(16).padStart(2, '0')).join(''),
  };
}
