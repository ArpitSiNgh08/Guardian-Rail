import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ContractAddress, SigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

/**
 * Browser-scoped Midnight private state.
 *
 * Guardian Rail currently has no application private-state ID, but Midnight.js
 * still requires this provider to scope state and retain the deployment
 * maintenance key. Keep that key in memory instead of plaintext web storage.
 */
function createBrowserPrivateStateProvider(): PrivateStateProvider<string, unknown> {
  let contractAddress: ContractAddress | undefined;
  const states = new Map<string, unknown>();
  const signingKeys = new Map<ContractAddress, SigningKey>();
  const scopedKey = (id: string) => {
    if (!contractAddress) throw new Error('Contract address has not been set for browser private state.');
    return `${contractAddress}:${id}`;
  };

  return {
    setContractAddress(address) {
      contractAddress = address;
    },
    async set(id, state) {
      states.set(scopedKey(id), state);
    },
    async get(id) {
      return states.get(scopedKey(id)) ?? null;
    },
    async remove(id) {
      states.delete(scopedKey(id));
    },
    async clear() {
      if (!contractAddress) return;
      const prefix = `${contractAddress}:`;
      for (const key of states.keys()) {
        if (key.startsWith(prefix)) states.delete(key);
      }
    },
    async setSigningKey(address, signingKey) {
      signingKeys.set(address, signingKey);
    },
    async getSigningKey(address) {
      return signingKeys.get(address) ?? null;
    },
    async removeSigningKey(address) {
      signingKeys.delete(address);
    },
    async clearSigningKeys() {
      signingKeys.clear();
    },
    async exportPrivateStates() {
      throw new Error('Browser private-state export is not supported.');
    },
    async importPrivateStates() {
      throw new Error('Browser private-state import is not supported.');
    },
    async exportSigningKeys() {
      throw new Error('Browser signing-key export is not supported.');
    },
    async importSigningKeys() {
      throw new Error('Browser signing-key import is not supported.');
    },
  };
}

const browserPrivateStateProvider = createBrowserPrivateStateProvider();

export function getBrowserPrivateStateProvider() {
  return browserPrivateStateProvider;
}
