import { createUnprovenCallTx, getPublicStates, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ledger, pureCircuits } from '../../../../contracts/guardian-rail/managed/guardian-rail/contract/index.js';
import { birthdateToEpochDays, hexToBytes, type LocalCredential, type LocalIssuerKeyPair } from './credential';
import { createIssuerRegistrationContract } from './contract';
import { getBrowserPrivateStateProvider } from './browser-private-state-provider';
import { createLaceMidnightProvider, createLaceProofProvider, createLacePublicDataProvider, createLaceWalletProvider } from './lace-providers';
import { refreshWalletConnection } from './wallet';
import { createGuardianRailZkConfigProvider } from './zk-config';

export async function registerCredentialOnChain(
  wallet: ConnectedAPI,
  credential: LocalCredential,
  issuerKeypair: LocalIssuerKeyPair,
) {
  setNetworkId('preprod');
  if (credential.issuerPublicKeyHex.toLowerCase() !== issuerKeypair.publicKeyHex.toLowerCase()) {
    throw new Error('The issuer keypair does not match the selected credential.');
  }
  const contractAddress = process.env.NEXT_PUBLIC_GUARDIAN_RAIL_CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error('The deployed Guardian Rail contract address is not configured.');

  wallet = await refreshWalletConnection(wallet);
  const [addresses, configuration] = await Promise.all([wallet.getShieldedAddresses(), wallet.getConfiguration()]);
  const publicDataProvider = createLacePublicDataProvider(configuration);
  const providers = {
    privateStateProvider: getBrowserPrivateStateProvider(),
    publicDataProvider,
    zkConfigProvider: createGuardianRailZkConfigProvider(),
    proofProvider: await createLaceProofProvider(wallet),
    walletProvider: createLaceWalletProvider(wallet, {
      coin: addresses.shieldedCoinPublicKey,
      encryption: addresses.shieldedEncryptionPublicKey,
    }),
    midnightProvider: createLaceMidnightProvider(wallet),
  } as never;

  const commitment = pureCircuits.credentialCommitmentFor(
    birthdateToEpochDays(credential.birthdate),
    hexToBytes(credential.saltHex),
  );
  const states = await getPublicStates(publicDataProvider, contractAddress);
  const call = await createUnprovenCallTx(providers, {
    compiledContract: createIssuerRegistrationContract(hexToBytes(issuerKeypair.privateKeyHex)),
    circuitId: 'registerCredential',
    contractAddress,
    args: [commitment],
    ...states,
  } as never);
  // `submitTx` waits forever for Indexer finalization. Lace has already accepted
  // the signing step by this point, so return its transaction id immediately and
  // let the UI show an honest pending-confirmation state.
  const transactionId = await submitTxAsync(providers, {
    unprovenTx: call.private.unprovenTx,
    circuitId: 'registerCredential',
  });
  return { transactionId, commitment };
}

/** Reads Preprod's latest state to confirm the registration, without trusting a wallet popup. */
export async function isCredentialRegistered(wallet: ConnectedAPI, credential: LocalCredential): Promise<boolean> {
  const contractAddress = process.env.NEXT_PUBLIC_GUARDIAN_RAIL_CONTRACT_ADDRESS;
  if (!contractAddress) return false;
  const configuration = await wallet.getConfiguration();
  const state = await createLacePublicDataProvider(configuration).queryContractState(contractAddress);
  if (!state) return false;
  const commitment = pureCircuits.credentialCommitmentFor(
    birthdateToEpochDays(credential.birthdate),
    hexToBytes(credential.saltHex),
  );
  return ledger(state.data).credentialCommitments.member(commitment);
}
