import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  credentialBirthDate(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  credentialSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  credentialHolderSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  issuerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerCredential(context: __compactRuntime.CircuitContext<PS>,
                     commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveAge(context: __compactRuntime.CircuitContext<PS>, contextId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type ProvableCircuits<PS> = {
  registerCredential(context: __compactRuntime.CircuitContext<PS>,
                     commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveAge(context: __compactRuntime.CircuitContext<PS>, contextId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type PureCircuits = {
  issuerKeyCommitmentFor(secret_0: Uint8Array): Uint8Array;
  credentialCommitmentFor(birthDate_0: bigint, salt_0: Uint8Array): Uint8Array;
  nullifierFor(contextId_0: Uint8Array,
               holderSecret_0: Uint8Array,
               version_0: bigint): Uint8Array;
}

export type Circuits<PS> = {
  registerCredential(context: __compactRuntime.CircuitContext<PS>,
                     commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveAge(context: __compactRuntime.CircuitContext<PS>, contextId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  issuerKeyCommitmentFor(context: __compactRuntime.CircuitContext<PS>,
                         secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  credentialCommitmentFor(context: __compactRuntime.CircuitContext<PS>,
                          birthDate_0: bigint,
                          salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  nullifierFor(context: __compactRuntime.CircuitContext<PS>,
               contextId_0: Uint8Array,
               holderSecret_0: Uint8Array,
               version_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly issuerKeyCommitment: Uint8Array;
  readonly minimumBirthDate: bigint;
  readonly policyVersion: bigint;
  credentialCommitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  spentNullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               _issuerKeyCommitment_0: Uint8Array,
               _minimumBirthDate_0: bigint,
               _policyVersion_0: bigint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
