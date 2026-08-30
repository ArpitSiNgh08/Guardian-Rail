import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

const walletSources = new WeakMap<ConnectedAPI, InitialAPI>();

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
  walletSources.set(wallet, selected.api);
  setNetworkId(networkId);
  return { wallet, name: selected.api.name };
}

export function isWalletChannelShutdownError(reason: unknown) {
  const message = reason instanceof Error ? reason.message : String(reason);
  return /remote api.*shutdown|object can no longer be used/i.test(message);
}

/** Return the existing connection when healthy, otherwise reconnect the exact injected wallet. */
export async function refreshWalletConnection(wallet: ConnectedAPI, networkId = 'preprod') {
  try {
    const status = await wallet.getConnectionStatus();
    if (status.status === 'connected' && status.networkId === networkId) return wallet;
  } catch (reason) {
    if (!isWalletChannelShutdownError(reason)) throw reason;
  }

  const source = walletSources.get(wallet) ?? discoverWallets()[0]?.api;
  if (!source) throw new Error('The Midnight wallet extension is no longer available.');
  const connected = await source.connect(networkId);
  walletSources.set(connected, source);
  setNetworkId(networkId);
  return connected;
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
