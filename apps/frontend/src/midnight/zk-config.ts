import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

export type GuardianRailCircuit = 'proveAge' | 'registerCredential';

export function createGuardianRailZkConfigProvider() {
  const baseUrl = typeof window === 'undefined'
    ? 'http://localhost:3000/api/contract-assets'
    : `${window.location.origin}/api/contract-assets`;
  return new FetchZkConfigProvider<GuardianRailCircuit>(baseUrl);
}
