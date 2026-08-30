import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import { birthdateToEpochDays, getOrCreateHolderSecret, hexToBytes, type LocalCredential } from './credential';

export interface GuardianRailWitnessState {
  readonly credential: LocalCredential;
  readonly holderSecret: Uint8Array;
}

/**
 * Witness callbacks for the generated Guardian Rail contract.
 * The issuer secret is intentionally not part of this user-side factory:
 * only the issuer can call registerCredential.
 */
export function createUserWitnesses(storage: Storage, credential: LocalCredential) {
  const state: GuardianRailWitnessState = {
    credential,
    holderSecret: getOrCreateHolderSecret(storage),
  };

  return {
    credentialBirthDate(context: WitnessContext<unknown, GuardianRailWitnessState>) {
      return [context.privateState, birthdateToEpochDays(state.credential.birthdate)] as [GuardianRailWitnessState, bigint];
    },
    credentialSalt(context: WitnessContext<unknown, GuardianRailWitnessState>) {
      return [context.privateState, hexToBytes(state.credential.saltHex)] as [GuardianRailWitnessState, Uint8Array];
    },
    credentialHolderSecret(context: WitnessContext<unknown, GuardianRailWitnessState>) {
      return [context.privateState, state.holderSecret] as [GuardianRailWitnessState, Uint8Array];
    },
    issuerSecret(_context: WitnessContext<unknown, GuardianRailWitnessState>) {
      throw new Error('issuerSecret is only available in the issuer registration flow.');
    },
  };
}
