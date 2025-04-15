import { Injectable } from '@nestjs/common';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Pass } from './pass';
import { Storage } from './storage';
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
    Storage.initialize();
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
   * Pre-register: Generate attestation options for registering a passkey
   */
  async preRegister(user: User<BaseProfile, Record<string, unknown>>, api: ApiPromise, pass: Pass): Promise<any> {
    if (!user?.profile?.id) {
      throw new Error('User ID is required');
    }

    if (!api || !pass) {
      throw new Error('API and Pass objects must be provided');
    }

    console.log("preRegister", user.profile.id);
    const hashedUserId = await hashUserId(user.profile.id);
    const [challenge, blockNumber] = await Pass.generateChallenge(api);
    console.log("preRegister", challenge, blockNumber);
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
    };

    Storage.set(user.profile.id, { attestationOptions, blockNumber, credentialId: "" });
    
    return attestationOptions;
  }

  /**
   * Post-register: Process attestation response and register the passkey
   */
  async postRegister(userId: string, attestationResponse: any, api: ApiPromise, pass: Pass): Promise<any> {
    console.log('Checking API and Pass...');
    if (!api || !pass) {
      console.log('API or Pass missing');
      throw new Error('API and Pass objects must be provided');
    }

    console.log('Getting stored data for user:', userId);
    const storedData = Storage.get(userId);

    console.log('Checking if stored data exists...');
    if (!storedData) {
      console.log('No stored data found');
      throw new Error('User data not found');
    }

    console.log('Extracting block number from stored data');
    const { blockNumber } = storedData;
    console.log('Hashing user ID...');
    const hashedUserId = await hashUserId(userId);

    console.log('Calling pass.register with params...');
    const [_, ext] = await pass.register(
      blockNumber!,
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
      
      console.log('Updating storage with credential ID...');
      Storage.set(userId, { ...storedData, credentialId: attestationResponse.rawId });
      
      console.log('Returning extrinsic...');
      return {
        result: 'success',
        address: dest,
        ext,
      };
    } catch (error) {
      console.log('Error occurred during extrinsic sending');
      console.error('Error sending extrinsic:', error);
      throw new Error('Failed to send extrinsic to server');
    }
  }

  /**
   * Pre-connect: Generate assertion options for authenticating with a passkey
   */
  async preConnect(userId: string, api: ApiPromise, pass: Pass): Promise<any> {
    if (!api || !pass) {
      throw new Error('API and Pass objects must be provided');
    }

    const storedData = Storage.get(userId);
    if (!storedData) {
      throw new Error('User data not found');
    }
    
    const [challenge, blockNumber] = await Pass.generateChallenge(api);
    
    // Update storage with new block number
    Storage.set(userId, { ...storedData, blockNumber });

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
    };

    return assertionOptions;
  }

  /**
   * Post-connect: Process assertion response and authenticate the user
   */
  async postConnect(userId: string, assertionResponse: any, api: ApiPromise, pass: Pass): Promise<any> {
    if (!api || !pass) {
      throw new Error('API and Pass objects must be provided');
    }

    const storedData = Storage.get(userId);

    if (!storedData) {
      throw new Error('User data not found');
    }

    const { blockNumber } = storedData;

    try {
      if (!userId || !assertionResponse) {
        throw new Error('User ID and assertion response are required');
      }
    
      const storedData = Storage.get(userId);

      if (!storedData) {
        throw new Error('User data not found');
      }
    
      const hashedUserId = await hashUserId(userId);
    
      const [tx, ext] = await pass.authenticate(
        blockNumber!,
        hashedUserId,
        new Uint8Array(assertionResponse.rawId),
        base64urlToUint8Array(assertionResponse.response.authenticatorData),
        base64urlToUint8Array(assertionResponse.response.clientDataJSON),
        base64urlToUint8Array(assertionResponse.response.signature)
      );
    
      console.log(api);
      
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