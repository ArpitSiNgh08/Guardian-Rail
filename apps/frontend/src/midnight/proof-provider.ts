import { dappConnectorProvingProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import type { ProvingProvider } from '@midnight-ntwrk/dapp-connector-api';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { createGuardianRailZkConfigProvider } from './zk-config';

/**
 * Creates a Lace-backed proving provider for the compiled Guardian Rail
 * circuits. The provider keeps witness execution in the connected wallet.
 */
export function createGuardianRailProvingProvider(wallet: ConnectedAPI): Promise<ProvingProvider> {
  const zkConfigProvider = createGuardianRailZkConfigProvider();
  return dappConnectorProvingProvider(wallet, zkConfigProvider);
}
