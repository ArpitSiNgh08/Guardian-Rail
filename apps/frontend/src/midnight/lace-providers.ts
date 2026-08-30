import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { CostModel } from '@midnight-ntwrk/ledger-v8';
import { Transaction } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { FinalizedTransaction } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { MidnightProvider, WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { createProofProvider } from '@midnight-ntwrk/midnight-js-types';
import { createGuardianRailZkConfigProvider } from './zk-config';
import { isWalletChannelShutdownError, refreshWalletConnection } from './wallet';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) throw new Error('Wallet returned an invalid transaction.');
  return Uint8Array.from(hex.match(/../g)!, (pair) => Number.parseInt(pair, 16));
}

/** Adapts Lace's serialized transaction API to Midnight.js's provider contract. */
export function createLaceWalletProvider(
  wallet: ConnectedAPI,
  keys: { coin: string; encryption: string },
): WalletProvider {
  let activeWallet = wallet;
  return {
    async balanceTx(tx, ttl) {
      activeWallet = await refreshWalletConnection(activeWallet);
      const result = await activeWallet.balanceUnsealedTransaction(bytesToHex(tx.serialize()), {
        payFees: true,
      });
      const balanced = Transaction.deserialize(
        'signature',
        'proof',
        'binding',
        hexToBytes(result.tx),
      );
      void ttl;
      return balanced as FinalizedTransaction;
    },
    getCoinPublicKey() {
      if (!keys) throw new Error('Shielded wallet keys have not been loaded.');
      return keys.coin;
    },
    getEncryptionPublicKey() {
      if (!keys) throw new Error('Shielded wallet keys have not been loaded.');
      return keys.encryption;
    },
  };
}

export function createLaceMidnightProvider(wallet: ConnectedAPI): MidnightProvider {
  let activeWallet = wallet;
  return {
    async submitTx(tx) {
      const serialized = bytesToHex(tx.serialize());
      activeWallet = await refreshWalletConnection(activeWallet);
      try {
        await activeWallet.submitTransaction(serialized);
      } catch (reason) {
        if (!isWalletChannelShutdownError(reason)) throw reason;
        // Lace can close the popup's remote channel after signing. Reconnect and
        // submit the same transaction; its identifier makes this retry idempotent.
        activeWallet = await refreshWalletConnection(activeWallet);
        await activeWallet.submitTransaction(serialized);
      }
      return tx.identifiers()[0];
    },
  };
}

export async function createLaceProofProvider(wallet: ConnectedAPI) {
  const activeWallet = await refreshWalletConnection(wallet);
  const zkConfigProvider = createGuardianRailZkConfigProvider();
  const provingProvider = await activeWallet.getProvingProvider({
    getZKIR: (circuit) => zkConfigProvider.getZKIR(circuit as 'proveAge' | 'registerCredential'),
    getProverKey: (circuit) => zkConfigProvider.getProverKey(circuit as 'proveAge' | 'registerCredential'),
    getVerifierKey: (circuit) => zkConfigProvider.getVerifierKey(circuit as 'proveAge' | 'registerCredential'),
  });
  return createProofProvider(provingProvider, CostModel.initialCostModel());
}

export function createLacePublicDataProvider(walletConfiguration: { indexerUri: string; indexerWsUri: string }) {
  return indexerPublicDataProvider(walletConfiguration.indexerUri, walletConfiguration.indexerWsUri);
}
