import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { DeploymentConfig } from '@/lib/api';
import { createGuardianRailDeploymentContract } from './contract';
import { hexToBytes } from './credential';
import { createLaceMidnightProvider, createLaceProofProvider, createLacePublicDataProvider, createLaceWalletProvider } from './lace-providers';
import { createGuardianRailZkConfigProvider } from './zk-config';

export async function deployGuardianRail(wallet: ConnectedAPI, config: DeploymentConfig): Promise<string> {
  const [addresses, configuration] = await Promise.all([wallet.getShieldedAddresses(), wallet.getConfiguration()]);
  const providers = {
    publicDataProvider: createLacePublicDataProvider(configuration),
    zkConfigProvider: createGuardianRailZkConfigProvider(),
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
