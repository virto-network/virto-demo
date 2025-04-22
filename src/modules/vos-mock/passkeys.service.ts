import { Injectable } from '@nestjs/common';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { hexToU8a } from '@polkadot/util';
import { ISubmittableResult } from '@polkadot/types/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { Pass } from './pass';

@Injectable()
export class PasskeysService {
  private readonly seed: string;

  constructor() {
    this.seed = process.env.SEED || '';

    if (!this.seed) {
      throw new Error('SEED not found in environment variables');
    }
  }

  private signSendAndWait(
    tx: SubmittableExtrinsic<'promise'>,
    signer: KeyringPair
  ): Promise<ISubmittableResult> {
    return new Promise<ISubmittableResult>((resolve, reject) =>
      tx.signAndSend(signer, (result) => {
        switch (true) {
          case result.isError:
            return reject(result.status);
          case result.isInBlock:
            return resolve(result);
          case result.isWarning:
            console.warn(result.toHuman(true));
        }
      })
    );
  }

  async signTransaction(wsUrl: string, extrinsicHex: string): Promise<any> {
    let api: ApiPromise;

    const wsProvider = new WsProvider(wsUrl);
    api = await ApiPromise.create({ provider: wsProvider });

    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
    const signer = keyring.addFromUri("//Alice");

    const extrinsic = api.tx(hexToU8a(extrinsicHex));

    let result = await this.signSendAndWait(extrinsic, signer);

    const { event: registeredEvent } = result.events.find(
      (record) => record.event.method === 'Registered'
    )!;

    let accountKey = keyring.encodeAddress(
      // @ts-ignore
      (registeredEvent.data as unknown as Record<string, any>).who.toU8a()
    );
    
    return {
      address: accountKey
    };
  }

  async transferMembership(wsUrl: string, dest: string): Promise<any> {

    const wsProvider = new WsProvider(wsUrl);
    const api = await ApiPromise.create({ provider: wsProvider });
 
    
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
    const signer = keyring.addFromUri("//Alice");

    const collection = 0;    
    const item = 5;

    const transferCall = api.tx.communityMemberships.transfer(
      collection,
      item,
      dest
    );

    let result = await this.signSendAndWait(transferCall, signer);
    for (const event of result.events) {
      console.debug(event.event.method);
    }

    const { event: registeredEvent } = result.events.find(
      (record) => record.event.method === 'ExtrinsicSuccess'
    )!;

    if (!registeredEvent) {
      return {
        success: false
      };
    }

    return {
      success: true,
      address: dest
    };
  }
} 