import { CompiledContract } from '@midnight-ntwrk/compact-js';
import type { Contract as GuardianRailContract } from '../../../../contracts/guardian-rail/managed/guardian-rail/contract/index.js';
import { Contract } from '../../../../contracts/guardian-rail/managed/guardian-rail/contract/index.js';
import { createUserWitnesses } from './witnesses';
import type { LocalCredential } from './credential';
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';

const compiledAssetsPath = '../../../../contracts/guardian-rail/managed/guardian-rail';

/**
 * Creates the compiled contract binding used by Midnight.js.
 *
 * The generated contract and proving keys are local build outputs at present.
 * The deployment/runtime layer will supply the network providers and the
 * browser will continue to own the witness state.
 */
export function createGuardianRailContract(storage: Storage, credential: LocalCredential) {
  const witnesses = createUserWitnesses(storage, credential);
  return CompiledContract.make<GuardianRailContract>('GuardianRail', Contract)
    .pipe(
      CompiledContract.withWitnesses(witnesses),
      CompiledContract.withCompiledFileAssets(compiledAssetsPath),
    );
}

export function createGuardianRailDeploymentContract() {
  const vacantWitnesses = {
    credentialBirthDate: () => { throw new Error('Deployment does not use credential witnesses.'); },
    credentialSalt: () => { throw new Error('Deployment does not use credential witnesses.'); },
    credentialHolderSecret: () => { throw new Error('Deployment does not use credential witnesses.'); },
    issuerSecret: () => { throw new Error('Deployment does not use credential witnesses.'); },
  };
  return CompiledContract.make<GuardianRailContract>('GuardianRail', Contract)
    .pipe(
      CompiledContract.withWitnesses(vacantWitnesses as never),
      CompiledContract.withCompiledFileAssets(compiledAssetsPath),
    );
}

export function createIssuerRegistrationContract(issuerSecret: Uint8Array) {
  const issuerWitnesses = {
    credentialBirthDate: () => { throw new Error('Issuer registration does not use credential witnesses.'); },
    credentialSalt: () => { throw new Error('Issuer registration does not use credential witnesses.'); },
    credentialHolderSecret: () => { throw new Error('Issuer registration does not use credential witnesses.'); },
    issuerSecret(context: WitnessContext<unknown, unknown>) {
      return [context.privateState, issuerSecret] as [unknown, Uint8Array];
    },
  };
  return CompiledContract.make<GuardianRailContract>('GuardianRail', Contract)
    .pipe(
      CompiledContract.withWitnesses(issuerWitnesses as never),
      CompiledContract.withCompiledFileAssets(compiledAssetsPath),
    );
}
