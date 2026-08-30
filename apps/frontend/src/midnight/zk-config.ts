import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

export type GuardianRailCircuit = 'proveAge' | 'registerCredential';

const guardianRailCircuits: readonly GuardianRailCircuit[] = ['proveAge', 'registerCredential'];

export function getGuardianRailZkAssetBaseUrl() {
  return typeof window === 'undefined'
    ? 'http://localhost:3000/api/contract-assets'
    : `${window.location.origin}/api/contract-assets`;
}

export function createGuardianRailZkConfigProvider() {
  const fetchAssets = typeof window === 'undefined'
    ? globalThis.fetch
    : window.fetch.bind(window);
  return new FetchZkConfigProvider<GuardianRailCircuit>(
    getGuardianRailZkAssetBaseUrl(),
    fetchAssets,
  );
}

/** Fail with the concrete asset URL before Midnight.js wraps parallel reads in an opaque Effect error. */
export async function verifyGuardianRailZkAssets(
  provider: FetchZkConfigProvider<GuardianRailCircuit>,
) {
  try {
    await Promise.all(guardianRailCircuits.flatMap((circuit) => [
      provider.getVerifierKey(circuit),
      provider.getProverKey(circuit),
      provider.getZKIR(circuit),
    ]));
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : String(reason);
    throw new Error(`Unable to load compiled Guardian Rail ZK assets from ${getGuardianRailZkAssetBaseUrl()}: ${message}`, {
      cause: reason,
    });
  }
}
