import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { DeploymentConfig } from '@/lib/api';
import { createGuardianRailDeploymentContract } from './contract';
import { hexToBytes } from './credential';
import { createLaceMidnightProvider, createLaceProofProvider, createLacePublicDataProvider, createLaceWalletProvider } from './lace-providers';
import { createGuardianRailZkConfigProvider, verifyGuardianRailZkAssets } from './zk-config';
import { refreshWalletConnection } from './wallet';
import { getBrowserPrivateStateProvider } from './browser-private-state-provider';

export async function deployGuardianRail(wallet: ConnectedAPI, config: DeploymentConfig): Promise<string> {
  // Set in this bundle immediately before Midnight.js reads the global value.
  setNetworkId('preprod');
  wallet = await refreshWalletConnection(wallet);
  const [addresses, configuration] = await Promise.all([wallet.getShieldedAddresses(), wallet.getConfiguration()]);
  const zkConfigProvider = createGuardianRailZkConfigProvider();
  await verifyGuardianRailZkAssets(zkConfigProvider);
  const providers = {
    privateStateProvider: getBrowserPrivateStateProvider(),
    publicDataProvider: createLacePublicDataProvider(configuration),
    zkConfigProvider,
    proofProvider: await createLaceProofProvider(wallet),
    walletProvider: createLaceWalletProvider(wallet, {
      coin: addresses.shieldedCoinPublicKey,
      encryption: addresses.shieldedEncryptionPublicKey,
    }),
    midnightProvider: createLaceMidnightProvider(wallet),
  } as never;
  const deployed = await deployContract(providers, {
    compiledContract: createGuardianRailDeploymentContract(),
    args: [hexToBytes(config.issuerKeyCommitment), BigInt(config.minimumBirthDate), BigInt(config.policyVersion)],
    signingKey: sampleSigningKey(),
  } as never);
  return deployed.deployTxData.public.contractAddress;
}
