import { Injectable } from '@nestjs/common';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Pass } from './pass';
import { InMemorySessionStorage } from './storage';
import { BaseProfile, Command, User } from './types';
import { base64urlToUint8Array, hashUserId } from './utils';
import { PasskeysService } from './passkeys.service';

@Injectable()
export class VosMockService {

  private readonly rpName: string;

  constructor(
    private readonly PasskeysService: PasskeysService,
  ) {
    this.rpName = process.env.RP_NAME || 'Example RP';

    // Initialize storage
    // Storage.initialize();
  }


  /**
   * Send extrinsic to the signing service
   */
  private async sendExtrinsicToSigningService(wsUrl: string, extrinsic: string): Promise<any> {
    return await this.PasskeysService.signTransaction(wsUrl, extrinsic)
  }

  private async transferMembershipToAddress(wsUrl: string, dest: string): Promise<any> {
    return await this.PasskeysService.transferMembership(wsUrl, dest)
  }

  /**
   * Generate attestation options for registering a passkey
   */
  async attestation(user: User<BaseProfile>, api: ApiPromise, pass: Pass, sessionStorage: InMemorySessionStorage): Promise<any> {
    if (!user?.profile?.id) {
      throw new Error('User ID is required');
    }

    if (sessionStorage.get(user.profile.id)) {
      throw new Error('User already registered');
    }

    if (!api || !pass) {
      throw new Error('API and Pass objects must be provided');
    }

    console.log("attestation", user.profile.id);
    const hashedUserId = await hashUserId(user.profile.id);
    const [challenge, blockNumber] = await Pass.generateChallenge(api);
    console.log("attestation", challenge, blockNumber);
    const challengeHex = '0x' + Buffer.from(challenge).toString('hex');
    const userIdArray = Array.from(hashedUserId);

    const attestationOptions = {
      publicKey: {
        rp: {
          name: this.rpName,
        },
        user: {
          id: userIdArray,
          name: user.profile.name,
          displayName: user.profile.displayName,
        },
        challenge: challengeHex,
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: { userVerification: "preferred" },
        timeout: 60_000,
        attestation: "none",
      },
      blockNumber,
    };
    
    return attestationOptions;
  }

  /**
   * Process attestation response and register the passkey
   */
  async register(userId: string, attestationResponse: any, api: ApiPromise, pass: Pass, blockNumber: number, sessionStorage: InMemorySessionStorage): Promise<any> {
    console.log('Checking API and Pass...');
    if (!api || !pass) {
      console.log('API or Pass missing');
      throw new Error('API and Pass objects must be provided');
    }

    console.log('Hashing user ID...');
    const hashedUserId = await hashUserId(userId);

    const compactBlockNumber = api.createType('Compact<BlockNumber>', blockNumber);

    console.log('Calling pass.register with params...');
    const [_, ext] = await pass.register(
      compactBlockNumber,
      hashedUserId,
      new Uint8Array(attestationResponse.rawId),
      base64urlToUint8Array(attestationResponse.response.authenticatorData),
      base64urlToUint8Array(attestationResponse.response.clientDataJSON),
      base64urlToUint8Array(attestationResponse.response.publicKey)
    );

    try {
      console.log('Sending extrinsic to signing service...');
      console.log(api);
      const dataSign = await this.sendExtrinsicToSigningService(pass.wsUrl, ext);
      console.log('Extrinsic sent successfully:', dataSign);

      const dest = dataSign.address;
      console.log('Transferring membership to address:', dest);
      const dataTransfer = await this.transferMembershipToAddress(pass.wsUrl, dest);
      console.log('Membership transferred successfully:', dataTransfer);
      
      sessionStorage.set(userId, { credentialId: attestationResponse.rawId });

      return {
        ext,
        address: dest,
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
  async assertion(userId: string, api: ApiPromise, pass: Pass, sessionStorage: InMemorySessionStorage): Promise<any> {
    if (!api || !pass) {
      throw new Error('API and Pass objects must be provided');
    }

    const storedData = sessionStorage.get(userId);

    if (!storedData) {
      throw new Error('User data not found');
    }
    
    const [challenge, blockNumber] = await Pass.generateChallenge(api);
    
    // Update storage with new block number
    sessionStorage.set(userId, { ...storedData });

    const { credentialId } = storedData;

    const assertionOptions = {
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: credentialId,
            type: "public-key",
          },
        ],
        userVerification: "preferred",
        timeout: 60_000,
      },
      blockNumber,
    };

    return assertionOptions;
  }

  /**
   * Process assertion response and authenticate the user
   */
  async connect(userId: string, assertionResponse: any, api: ApiPromise, pass: Pass, blockNumber: number, sessionStorage: InMemorySessionStorage): Promise<any> {
    if (!api || !pass) {
      throw new Error('API and Pass objects must be provided');
    }

    const storedData = sessionStorage.get(userId);

    if (!storedData) {
      throw new Error('User data not found');
    }

    try {
      if (!userId || !assertionResponse) {
        throw new Error('User ID and assertion response are required');
      }
    
      const storedData = sessionStorage.get(userId);

      if (!storedData) {
        throw new Error('User data not found');
      }
    
      const hashedUserId = await hashUserId(userId);

      const compactBlockNumber = api.createType('Compact<BlockNumber>', blockNumber);
    
      const [tx, ext] = await pass.authenticate(
        compactBlockNumber,
        hashedUserId,
        new Uint8Array(assertionResponse.rawId),
        base64urlToUint8Array(assertionResponse.response.authenticatorData),
        base64urlToUint8Array(assertionResponse.response.clientDataJSON),
        base64urlToUint8Array(assertionResponse.response.signature)
      );
    
      const txMethod = tx.method.toHuman() as { method: string, section: string };
      const command: Command = {
        url: `${pass.wsUrl}/${txMethod.section}/${txMethod.method}`,
        body: tx.method.args,
        hex: ext
      };

      return {
        command
      };
    } catch (error) {
      console.error('Error during authentication:', error);
      throw new Error('Failed to authenticate user');
    }
  }
} 