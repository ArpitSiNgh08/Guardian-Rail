import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

export interface DiscoveredWallet {
  readonly api: InitialAPI;
  readonly key: string;
}

export function discoverWallets(): DiscoveredWallet[] {
  if (typeof window === 'undefined' || !window.midnight) return [];
  return Object.entries(window.midnight).map(([key, api]) => ({ api, key }));
}

export async function connectWallet(networkId = 'preprod'): Promise<{ wallet: ConnectedAPI; name: string }> {
  const discovered = discoverWallets();
  if (discovered.length === 0) {
    throw new Error('No Midnight wallet detected. Install or unlock Lace, then try again.');
  }

  const selected = discovered[0];
  const wallet = await selected.api.connect(networkId);
  return { wallet, name: selected.api.name };
}

export async function getPublicWalletAddress(wallet: ConnectedAPI) {
  return (await wallet.getUnshieldedAddress()).unshieldedAddress;
}

export async function getWalletConfiguration(wallet: ConnectedAPI) {
  const configuration = await wallet.getConfiguration();
  if (configuration.networkId !== 'preprod') {
    throw new Error(`Wallet is connected to ${configuration.networkId}; switch Lace to Midnight Preprod.`);
  }
  return configuration;
}

export async function getWalletDustBalance(wallet: ConnectedAPI) {
  return wallet.getDustBalance();
}
