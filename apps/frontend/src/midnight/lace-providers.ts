import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { CostModel } from '@midnight-ntwrk/ledger-v8';
import { LedgerParameters, ZswapChainState } from '@midnight-ntwrk/ledger-v8';
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

async function queryIndexer(queryUrl: string, query: string, variables: Record<string, unknown>) {
  const response = await fetch(queryUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Midnight Indexer returned HTTP ${response.status}.`);
  const payload = await response.json() as { data?: Record<string, unknown>; errors?: Array<{ message?: string }> };
  if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message ?? 'Unknown Indexer error').join('; '));
  return payload.data;
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
  const base = indexerPublicDataProvider(walletConfiguration.indexerUri, walletConfiguration.indexerWsUri);
  const { indexerUri } = walletConfiguration;

  // The hosted Preview/Preprod Indexers reject the SDK's default `offset: null`
  // request. These explicit latest-state queries intentionally omit `offset`.
  return {
    ...base,
    async queryContractState(contractAddress: string, config?: unknown) {
      if (config) return base.queryContractState(contractAddress, config as never);
      const data = await queryIndexer(indexerUri, `query LatestState($address: HexEncoded!) {
        contractAction(address: $address) { state }
      }`, { address: contractAddress });
      const action = data?.contractAction as { state?: string } | undefined;
      return action?.state ? ContractState.deserialize(hexToBytes(action.state)) : null;
    },
    async queryZSwapAndContractState(contractAddress: string, config?: unknown) {
      if (config) return base.queryZSwapAndContractState(contractAddress, config as never);
      const data = await queryIndexer(indexerUri, `query LatestStates($address: HexEncoded!) {
        contractAction(address: $address) {
          state
          zswapState
          transaction { block { ledgerParameters } }
        }
      }`, { address: contractAddress });
      const action = data?.contractAction as {
        state?: string;
        zswapState?: string;
        transaction?: { block?: { ledgerParameters?: string | null } | null } | null;
      } | undefined;
      if (!action?.state || !action.zswapState) return null;
      return [
        ZswapChainState.deserialize(hexToBytes(action.zswapState)),
        ContractState.deserialize(hexToBytes(action.state)),
        action.transaction?.block?.ledgerParameters
          ? LedgerParameters.deserialize(hexToBytes(action.transaction.block.ledgerParameters))
          : LedgerParameters.initialParameters(),
      ] as never;
    },
  };
}
