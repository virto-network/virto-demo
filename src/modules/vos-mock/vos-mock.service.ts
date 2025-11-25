import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { SQLiteSessionStorage } from './storage';
import { BaseProfile, User } from './types';
import { hashUserId } from './utils';
import { kreivo, MultiAddress } from "@polkadot-api/descriptors";
import { polkadotSigner } from './signer';
import { Binary, createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { ConfigService } from '../../config/config.service';
import { MatrixService } from '../matrix/matrix.service';

@Injectable()
export class VosMockService {

  private readonly rpName: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => MatrixService))
    private readonly matrixService: MatrixService,
  ) {
    this.rpName = process.env.RP_NAME || 'Example RP';

    // Initialize storage
    // Storage.initialize();
  }

  /**
   * Generate attestation options for registering a passkey
   */
  async attestation(user: User<BaseProfile>, challengeHex: string): Promise<any> {
    if (!user?.profile?.id) {
      throw new Error('User ID is required');
    }

    console.log("attestation", user.profile.id);
    const hashedUserId = await hashUserId(user.profile.id);
    const userIdArray = Array.from(hashedUserId);

    const publicKey = {
        rp: {
            name: this.rpName,
        },
        user: {
            id: userIdArray,
            name: user.profile.id.toString(),
            displayName: user.profile.name as string ?? user.profile.id.toString(),
        },
        challenge: challengeHex,
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: { userVerification: "required" },
        timeout: 60000,
        attestation: "none",
    };
    
    return publicKey;
  }

  /**
   * Process attestation response and register the passkey
   */
  async register(userId: any, hashedUserId: string, credentialId: string, address: string, attestationResponse: any, sessionStorage: SQLiteSessionStorage): Promise<any> {
    console.log('Hashing user ID...');

    const client = createClient(
      getWsProvider(this.configService.getKreivoProvider())
    );
  
    const kreivoApi = client.getTypedApi(kreivo);

    // Convert client_data JSON string to hex
    const clientDataHex = '0x' + Buffer.from(attestationResponse.client_data, 'utf8').toString('hex');
    
    const registerCharlotte = kreivoApi.tx.Pass.register({
      user: Binary.fromHex(hashedUserId),
      attestation: {
        type: "WebAuthn",
        value: {
          authenticator_data: Binary.fromHex(attestationResponse.authenticator_data),
          client_data: Binary.fromHex(clientDataHex),
          public_key: Binary.fromHex(attestationResponse.public_key),
          meta: {
            device_id: Binary.fromHex(attestationResponse.meta.deviceId),
            context: Number(attestationResponse.meta.context),
            authority_id: Binary.fromHex(attestationResponse.meta.authority_id)
          }
        }
      },
    });

    try {
      const registerRes = await new Promise((resolve, reject) => {
        registerCharlotte.signSubmitAndWatch(polkadotSigner)
          .subscribe({
            next: (event) => {
              console.info('Transaction event:', event.type);
              if (event.type === 'txBestBlocksState') {
                resolve({ ok: true, txHash: event.txHash, blockHash: event.found });
              }
            },
            error: (error) => {
              console.error('Transaction error:', error);
              reject(error);
            }
          });
      });

      console.log({ registerRes });

      const result = registerRes as { ok: boolean };
      if (!result.ok) {
        throw new Error('Failed to register');
      }
      
      await sessionStorage.set(userId, { credentialId, address });

      return {
        ok: true,
      };
    } catch (error) {
      console.log('Error occurred during extrinsic sending');
      console.error('Error sending extrinsic:', error);
      throw new Error('Failed to send extrinsic to server');
    }
  }

  /**
   * Generate assertion options for authenticating with a passkey
   */
  async assertion(userId: string, challengeHex: string, sessionStorage: SQLiteSessionStorage): Promise<any> {
    const storedData = await sessionStorage.get(userId);
    console.log("assertion", userId, challengeHex, storedData);

    if (!storedData) {
      throw new Error('User data not found');
    }
    
    // Update storage with new block number
    await sessionStorage.set(userId, { ...storedData });

    const { credentialId } = storedData;

    const publicKey = {
      challenge: challengeHex,
      allowCredentials: [
        {
          id: credentialId,
          type: "public-key",
        },
      ],
      userVerification: "preferred",
      timeout: 60_000,
    };

    return publicKey;
  }

  async addMember(userId: string, storage: SQLiteSessionStorage) {
    console.log('Checking Matrix membership for user:', userId);
    const isMemberOfMatrix = await this.matrixService.isMember(userId);
    
    if (!isMemberOfMatrix) {
      throw new Error(`User ${userId} is not a member of the Matrix room #kreivo:virto.community`);
    }

    console.log('User is a member of Matrix room, proceeding with addMember...');

    const client = createClient(
      getWsProvider(this.configService.getKreivoProvider())
    );

    const storedData = await storage.get(userId);

    if (!storedData) {
      throw new Error('User data not found');
    }

    const { address } = storedData;

    if (!address) {
      throw new Error('Address not found');
    }
  
    const kreivoApi = client.getTypedApi(kreivo);

    const addMembership = kreivoApi.tx.Communities.add_member({
      who: MultiAddress.Id(address),
    }).decodedCall;

    const addMember = kreivoApi.tx.Utility.batch_all({
      calls: [
        addMembership,
      ],
    });    
    
    const addMemberRes = await new Promise((resolve, reject) => {
      addMember.signSubmitAndWatch(polkadotSigner)
        .subscribe({
          next: (event) => {
            console.info('Add member transaction event:', event.type);
            if (event.type === 'txBestBlocksState') {
              resolve({ ok: true, txHash: event.txHash, blockHash: event.found });
            }
          },
          error: (error) => {
            console.error('Add member transaction error:', error);
            reject(error);
          }
        });
    });

    console.log(addMemberRes);

    const result = addMemberRes as { ok: boolean };
    if (!result.ok) {
      throw new Error('Failed to add member');
    }

    return {
      ok: true,
    };
  }

  async isMember(address: string) {
    const client = createClient(
      getWsProvider(this.configService.getKreivoProvider())
    );

    const kreivoApi = client.getTypedApi(kreivo);

    const membershipKeys = await kreivoApi.query.CommunityMemberships.Account.getEntries(
      address, parseInt(this.configService.getCommunityId())
    );

    console.log({membershipKeys});

    if (membershipKeys.length === 0) {
      throw new Error('Not a member');
    }

    return {
      ok: true,
    };
  }
} 