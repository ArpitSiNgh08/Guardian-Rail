import { CompiledContract } from '@midnight-ntwrk/compact-js';
import type { Contract as GuardianRailContract } from '../../../../contracts/guardian-rail/managed/guardian-rail/contract/index.js';
import { Contract } from '../../../../contracts/guardian-rail/managed/guardian-rail/contract/index.js';
import { createUserWitnesses } from './witnesses';
import type { LocalCredential } from './credential';

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
