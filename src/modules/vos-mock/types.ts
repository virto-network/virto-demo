import { Compact } from "@polkadot/types";


export { type BlockNumber } from "@polkadot/types/interfaces";
import type { BlockNumber } from "@polkadot/types/interfaces";
export { type Compact } from "@polkadot/types";


export interface BaseProfile {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
}

export interface User<P, M> {
  profile: P;
  metadata?: M;
}

export type Command = {
  url: string;
  body: any;
  hex: string;
};

export type StoredData = {
  attestationOptions?: any;
  blockNumber?: Compact<BlockNumber>;
  credentialId?: string;
} 


export type AttestationMeta<Cx> = {
  authorityId: Uint8Array;
  deviceId: Uint8Array;
  context: Cx;
};

export type Attestation<Cx> = {
  meta: AttestationMeta<Cx>;
  authenticatorData: Uint8Array;
  clientData: Uint8Array;
  publicKey: Uint8Array;
};

export type AssertionMeta<Cx> = {
  authorityId: Uint8Array;
  userId: Uint8Array;
  context: Cx;
};

export type Assertion<Cx> = {
  meta: AssertionMeta<Cx>;
  authenticatorData: Uint8Array;
  clientData: Uint8Array;
  signature: Uint8Array;
};
