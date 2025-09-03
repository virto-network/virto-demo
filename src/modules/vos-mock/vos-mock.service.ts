import { Injectable } from '@nestjs/common';
import { InMemorySessionStorage } from './storage';
import { BaseProfile, User } from './types';
import { hashUserId } from './utils';
import { kreivo, MultiAddress } from "@polkadot-api/descriptors";
import { polkadotSigner } from './signer';
import { Binary, createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { ConfigService } from '../../config/config.service';

@Injectable()
export class VosMockService {

  private readonly rpName: string;

  constructor(
    private readonly configService: ConfigService,
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
  async register(userId: any, hashedUserId: string, credentialId: string, address: string, attestationResponse: any, sessionStorage: InMemorySessionStorage): Promise<any> {
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
      const registerRes = await registerCharlotte.signAndSubmit(polkadotSigner);
      console.log({ registerRes });

      if (!registerRes.ok) {
        throw new Error('Failed to register');
      }
      
      sessionStorage.set(userId, { credentialId, address });

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
  async assertion(userId: string, challengeHex: string, sessionStorage: InMemorySessionStorage): Promise<any> {
    const storedData = sessionStorage.get(userId);
    console.log("assertion", userId, challengeHex, storedData);

    if (!storedData) {
      throw new Error('User data not found');
    }
    
    // Update storage with new block number
    sessionStorage.set(userId, { ...storedData });

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

  async addMember(userId: string, storage: InMemorySessionStorage) {
    const client = createClient(
      getWsProvider(this.configService.getKreivoProvider())
    );

    const storedData = storage.get(userId);

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

    const transfer = kreivoApi.tx.Balances.transfer_keep_alive({
      dest: MultiAddress.Id(address),
      value: BigInt("100000000000000"),
    }).decodedCall;

    const transferUSD = kreivoApi.tx.Assets.transfer_keep_alive({
      id: {
        type: "Here",
        value: 1, // Kusama 50000002 Paseo 50000087
      },
      target: MultiAddress.Id(address),
      amount: BigInt("100000000000000"),
    }).decodedCall;

    const addMember = kreivoApi.tx.Utility.batch_all({
      calls: [
        addMembership,
        transfer,
      ],
    });    
    
    const addMemberRes = await addMember.signAndSubmit(polkadotSigner);
    console.log(addMemberRes);

    if (!addMemberRes.ok) {
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