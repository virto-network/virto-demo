export { type BlockNumber } from "@polkadot/types/interfaces";
export { type Compact } from "@polkadot/types";
import { Bin, Binary } from "@polkadot-api/substrate-bindings";
import { Codec, Struct, u32 } from "scale-ts";


export interface BaseProfile {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
}

export interface User<P> {
  profile: P;
}

export type Command = {
  url: string;
  body: any;
  hex: string;
};

export type StoredData = {
  credentialId?: string;
  address?: string;
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

export type SubstrateKeyRegistration = {
  message: {
    context: number;
    challenge: string;
    authority_id: string;
  };
  public: string;
  signature: string;
};

// SCALE codecs for SubstrateKey
export type TSignedMessage = {
  context: number;
  challenge: Binary;
  authority_id: Binary;
};

export const SignedMessage: Codec<TSignedMessage> = Struct({
  context: u32,
  challenge: Bin(),
  authority_id: Bin(32),
});

export type TKeyRegistration = {
  message: TSignedMessage;
  public: Binary;
  signature: Binary;
};

export const KeyRegistration: Codec<TKeyRegistration> = Struct({
  message: SignedMessage,
  public: Bin(32),
  signature: Bin(64),
});

