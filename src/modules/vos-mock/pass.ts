import "@polkadot/api-augment/kusama";

import * as hash from "hash-wasm";

import { BlockNumber, Compact, AttestationMeta, AssertionMeta } from "./types";
import { hexToU8a } from "@polkadot/util";

import { ApiPromise } from "@polkadot/api";
import { Assertion } from "./assertion";
import { Attestation } from "./attestation";
import { SubmittableExtrinsic } from "@polkadot/api/types";


function strArray(str: string, size: number): Uint8Array {
  if (str.length > size) {
    console.warn(`String "${str}" exceeds the specified size of ${size}. It will be truncated.`);
  }
  
  return new Uint8Array(
    str
      .split("")
      .map((x) => x.charCodeAt(0))
      .concat(new Array(Math.max(0, size - str.length)).fill(0))
  );
}

export class Pass {
  private static readonly AUTHORITY_ID = "kreivo_p";
  private static readonly AUTHORITY_ID_SIZE = 32;

  static async generateChallenge(
    api: ApiPromise
  ): Promise<[Uint8Array, Compact<BlockNumber>]> {
    try {
      const {
        block: { header },
      } = await api.rpc.chain.getBlock();
      return [header.hash, header.number];
    } catch (error) {
      console.error("Error generating challenge:", error);
      throw new Error("Failed to generate challenge");
    }
  }

  constructor(public wsUrl: string, private readonly api: ApiPromise) { }

  private async getDeviceId(credentialId: Uint8Array): Promise<Uint8Array> {
    try {
      const hashed = await hash.blake2b(credentialId, 256);
      return hexToU8a(`0x${hashed}`);
    } catch (error) {
      console.error("Error generating device ID:", error);
      throw new Error("Failed to generate device ID");
    }
  }

  private getAuthorityId(): Uint8Array {
    return strArray(Pass.AUTHORITY_ID, Pass.AUTHORITY_ID_SIZE);
  }

  async register(
    blockNumber: Compact<BlockNumber>,
    hashedUserId: Uint8Array,
    credentialId: Uint8Array,
    authenticatorData: Uint8Array,
    clientData: Uint8Array,
    publicKey: Uint8Array
  ): Promise<[SubmittableExtrinsic<"promise">, string]> {
    try {
      const deviceId = await this.getDeviceId(credentialId);
      
      // Create attestation meta with the correct types
      const meta: AttestationMeta<Compact<BlockNumber>> = {
        authorityId: this.getAuthorityId(),
        deviceId,
        context: blockNumber
      };
      
      const attestation = this.api.createType(
        "PassWebauthnAttestation",
        new Attestation({
          meta,
          authenticatorData,
          clientData,
          publicKey,
        })
      );

      const tx = this.api.tx.pass.register(hashedUserId, { WebAuthn: attestation });
      return [tx, tx.toHex()];
    } catch (error) {
      console.error("Error in register:", error);
      throw new Error("Failed to register WebAuthn device");
    }
  }

  async authenticate(
    blockNumber: Compact<BlockNumber>,
    hashedUserId: Uint8Array,
    credentialId: Uint8Array,
    authenticatorData: Uint8Array,
    clientData: Uint8Array,
    signature: Uint8Array
  ): Promise<[SubmittableExtrinsic<"promise">, string]> {
    try {
      const deviceId = await this.getDeviceId(credentialId);
      
      // Create assertion meta with the correct types
      const meta: AssertionMeta<Compact<BlockNumber>> = {
        authorityId: this.getAuthorityId(),
        userId: hashedUserId,
        context: blockNumber
      };
      
      const assertion = new Assertion({
        meta,
        authenticatorData,
        clientData,
        signature,
      });

      const tx = this.api.tx.pass.authenticate(
        deviceId,
        {
          WebAuthn: assertion,
        },
        null
      );
      
      return [tx, tx.method.toHex()];
    } catch (error) {
      console.error("Error in authenticate:", error);
      throw new Error("Failed to authenticate with WebAuthn device");
    }
  }
}