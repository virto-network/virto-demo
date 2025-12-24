import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import WebAuthnEmulator from 'nid-webauthn-emulator';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { hashUserId } from '../src/modules/vos-mock/utils';
import { Blake2256, u32 } from '@polkadot-api/substrate-bindings';
import { mergeUint8 } from 'polkadot-api/utils';
import { Binary, createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/node';
import { InMemoryCredentialsHandler, WebAuthn } from '@virtonetwork/authenticators-webauthn';
import { KreivoPassSigner } from '@virtonetwork/signer';
import { ss58Encode } from "@polkadot-labs/hdkd-helpers";
import { ConfigService } from '../src/config/config.service';

describe('API Integration Tests', () => {
  let app: INestApplication;
  let emulator: WebAuthnEmulator;
  let userId: string;
  const origin = 'http://example.com';
  let chopsticksWsUrl: string;

  beforeAll(async () => {
    chopsticksWsUrl = (global as any).__CHOPSTICKS_URL__ || 'ws://localhost:8000';

    const mockConfigService = {
      get: (key: string) => {
        if (key === 'KREIVO_PROVIDER') return chopsticksWsUrl;
        return process.env[key] || '';
      },
      getPort: () => parseInt(process.env.PORT || '3000', 10),
      getNodeEnv: () => process.env.NODE_ENV || 'test',
      getKreivoProvider: () => chopsticksWsUrl,
      getPhrase: () => process.env.PHRASE || '',
      getDerivePath: () => process.env.DERIVE_PATH || '//Alice',
      getPublicIp: () => process.env.PUBLIC_IP || '0.0.0.0',
      getRpName: () => process.env.RP_NAME || 'Test RP',
      getSigningServiceUrl: () => process.env.SIGNING_SERVICE_URL || '',
      getCommunityId: () => process.env.COMMUNITY_ID || '1',
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    app = moduleRef.createNestApplication();

    await app.init();
    
    // Verify the override is working
    const configService = app.get(ConfigService);
    console.log('ConfigService override check - KREIVO_PROVIDER:', configService.getKreivoProvider());

    emulator = new WebAuthnEmulator();

    // Create navigator object if it doesn't exist in Node.js environment
    if (!(globalThis as any).navigator) {
      (globalThis as any).navigator = {};
    }

    Object.defineProperty((globalThis as any).navigator, "credentials", {
      configurable: true,
      value: {
        /** Polyfill for `navigator.credentials.create` */
        create: async (options: any) =>
          emulator.create(origin, options),
        /** Polyfill for `navigator.credentials.get` */
        get: async (options: any) =>
          emulator.get(origin, options),
      },
    });

    console.log(`Using Chopsticks at: ${chopsticksWsUrl}`);
  });

  afterAll(async () => {
    await app.close();
  });

  class TestAuthenticatiorOptions extends InMemoryCredentialsHandler {
    private credentialId: any;

    static deviceId(userId: string) {
      const id = this.credentialIds(userId).at(0);
      return id !== undefined ? Blake2256(new Uint8Array(id)) : undefined;
    }

    async onCreatedCredentials(
      userId: string,
      credential: any
    ): Promise<void> {
      await super.onCreatedCredentials(userId, credential);
      this.credentialId = credential.id;
    }

    async publicKeyCreateOptions(
      challenge: Uint8Array,
      user: any
    ): Promise<any> {
      const challengeHex = '0x' + Buffer.from(challenge).toString('hex');
      const response = await request(app.getHttpServer())
        .get(`/api/attestation?id=${user.name}&name=${user.displayName || user.name}&challenge=${challengeHex}`)
        .expect(200);

      const publicKey = response.body;
      publicKey.challenge = challenge;
      publicKey.user.id = new Uint8Array(publicKey.user.id);

      return publicKey;
    }

    getCredentialId() {
      return this.credentialId;
    }
  }

  async function blockHashChallenge(ctx: number, xtc: Uint8Array) {
    console.log("chopsticksWsUrl blockchallenge", chopsticksWsUrl);
    const client = createClient(getWsProvider(chopsticksWsUrl));
    const hash = await client._request("chain_getBlockHash", [ctx]);
    const blockHash = Binary.fromHex(hash);

    console.log("blockHash", blockHash.asHex());
    return Blake2256(mergeUint8([blockHash.asBytes(), xtc]));
  }

  describe('VOS-Mock Module', () => {
    describe('GET /api/health', () => {
      it('should return health status', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/health')
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('ok');
        expect(response.body).toHaveProperty('service');
        expect(response.body.service).toBe('vos-mock');
        expect(response.body).toHaveProperty('timestamp');
      });
    });

    describe('WebAuthn Registration Flow', () => {
      let hashedUserId: string;
      let authenticator: TestAuthenticatiorOptions;

      beforeAll(async () => {
        // Generate a unique userId for each test to avoid AccountAlreadyRegistered errors
        userId = `testuser-${Date.now()}@example.com`;
        hashedUserId = '0x' + Buffer.from(await hashUserId(userId)).toString('hex');
        authenticator = new TestAuthenticatiorOptions();
      });

      it('GET /api/attestation should return attestation options', async () => {
        const challengeBytes = await blockHashChallenge(777, new Uint8Array([]));
        const challenge = '0x' + Buffer.from(challengeBytes).toString('hex');

        const response = await request(app.getHttpServer())
          .get(`/api/attestation?id=${userId}&name=John Doe&challenge=${challenge}`)
          .expect(200);

        const attestationOptions = response.body;

        expect(attestationOptions).toHaveProperty('challenge');
        expect(attestationOptions.challenge).toBe(challenge);
        expect(attestationOptions).toHaveProperty('rp');
        expect(attestationOptions.rp).toHaveProperty('name');
        expect(attestationOptions).toHaveProperty('user');
        expect(attestationOptions.user).toHaveProperty('id');
        expect(Array.isArray(attestationOptions.user.id)).toBe(true);
        expect(attestationOptions.user).toHaveProperty('name');
        expect(attestationOptions.user.name).toBe(userId);
        expect(attestationOptions.user).toHaveProperty('displayName');
        expect(attestationOptions.user.displayName).toBe('John Doe');
        expect(attestationOptions).toHaveProperty('pubKeyCredParams');
        expect(Array.isArray(attestationOptions.pubKeyCredParams)).toBe(true);
        expect(attestationOptions.pubKeyCredParams[0]).toHaveProperty('type');
        expect(attestationOptions.pubKeyCredParams[0].type).toBe('public-key');
        expect(attestationOptions.pubKeyCredParams[0]).toHaveProperty('alg');
        expect(attestationOptions.pubKeyCredParams[0].alg).toBe(-7);
        expect(attestationOptions).toHaveProperty('authenticatorSelection');
        expect(attestationOptions.authenticatorSelection).toHaveProperty('userVerification');
        expect(attestationOptions.authenticatorSelection.userVerification).toBe('required');
        expect(attestationOptions).toHaveProperty('timeout');
        expect(attestationOptions.timeout).toBe(60000);
        expect(attestationOptions).toHaveProperty('attestation');
        expect(attestationOptions.attestation).toBe('none');
      });

      it('GET /api/attestation should return 400 when id is missing', async () => {
        const challengeBytes = await blockHashChallenge(777, new Uint8Array([]));
        const challenge = '0x' + Buffer.from(challengeBytes).toString('hex');

        const response = await request(app.getHttpServer())
          .get(`/api/attestation?name=John Doe&challenge=${challenge}`)
          .expect(400);

        expect(response.body.message).toContain('User ID is required');
      });

      it('GET /api/attestation should return 400 when challenge is missing', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/attestation?id=${userId}&name=John Doe`)
          .expect(400);

        expect(response.body.message).toContain('Challenge is required');
      });


      it('POST /api/register should process attestation response', async () => {
        const wa = await new WebAuthn(
          userId,
          blockHashChallenge,
          authenticator
        ).setup();


        const passSigner = new KreivoPassSigner(wa);

        const client = createClient(getWsProvider(chopsticksWsUrl || 'ws://localhost:21000'));

        console.log("chopsticksWsUrl client", chopsticksWsUrl);
        const finalizedBlock = await client.getFinalizedBlock();
        const attestation = await wa.register(finalizedBlock.number);


        const attestationJSON = {
          authenticator_data: attestation.authenticator_data.asHex(),
          client_data: attestation.client_data.asText(),
          public_key: attestation.public_key.asHex(),
          meta: {
            deviceId: attestation.meta.device_id.asHex(),
            context: attestation.meta.context,
            authority_id: attestation.meta.authority_id.asHex(),
          },
        };
        const credentialIdBuffer = TestAuthenticatiorOptions.credentialIds(userId)[0];
        const credentialId = Buffer.from(credentialIdBuffer).toString('base64url');
        console.log("credentialId:", credentialId);

        const passAccountAddress = ss58Encode(passSigner.publicKey);

        const response = await request(app.getHttpServer())
          .post('/api/register')
          .send({
            userId: userId,
            hashedUserId: hashedUserId,
            credentialId: credentialId,
            address: passAccountAddress,
            attestationResponse: attestationJSON,
          });

        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(300);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('ok');
        expect(response.body.ok).toBe(true);

        
      });


      it('should wait about 36 seconds after registration block to allow for finalization', async () => {
        // As per instruction, introducing a 36 second wait to allow for block finalization
        // This prevents race conditions for following tests depending on on-chain state
        const waitSeconds = 36;
        console.log(`Waiting ${waitSeconds} seconds for block finalization...`);
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
        expect(true).toBe(true); // dummy assertion to keep the test green
      });


      it('POST /api/register should return 400 when userId is missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/register')
          .send({
            hashedUserId: hashedUserId,
            credentialId: 'test-credential-id',
            address: 'test-address',
            attestationResponse: {},
          })
          .expect(400);

        expect(response.body.message).toContain('User ID and attestation response are required');
      });

      it('POST /api/register should return 400 when attestationResponse is missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/register')
          .send({
            userId: userId,
            hashedUserId: hashedUserId,
            credentialId: 'test-credential-id',
            address: 'test-address',
          })
          .expect(400);

        expect(response.body.message).toContain('User ID and attestation response are required');
      });
    });

    describe('WebAuthn Authentication Flow', () => {
      it('GET /api/assertion should return assertion options for registered user', async () => {
        const challengeBytes = await blockHashChallenge(777, new Uint8Array([]));
        const challenge = '0x' + Buffer.from(challengeBytes).toString('hex');

        const response = await request(app.getHttpServer())
          .get(`/api/assertion?userId=${userId}&challenge=${challenge}`)
          .expect(200);

        const assertionOptions = response.body;

        expect(assertionOptions).toBeDefined();
        expect(assertionOptions).toHaveProperty('challenge');
        expect(assertionOptions.challenge).toBe(challenge);
        expect(assertionOptions).toHaveProperty('allowCredentials');
        expect(Array.isArray(assertionOptions.allowCredentials)).toBe(true);
        expect(assertionOptions.allowCredentials.length).toBeGreaterThan(0);
        expect(assertionOptions.allowCredentials[0]).toHaveProperty('id');
        expect(assertionOptions.allowCredentials[0]).toHaveProperty('type');
        expect(assertionOptions.allowCredentials[0].type).toBe('public-key');
        expect(assertionOptions).toHaveProperty('userVerification');
        expect(assertionOptions.userVerification).toBe('preferred');
        expect(assertionOptions).toHaveProperty('timeout');
        expect(assertionOptions.timeout).toBe(60000);
      });

      it('GET /api/assertion should return 400 when userId is missing', async () => {
        const challengeBytes = await blockHashChallenge(777, new Uint8Array([]));
        const challenge = '0x' + Buffer.from(challengeBytes).toString('hex');

        const response = await request(app.getHttpServer())
          .get(`/api/assertion?challenge=${challenge}`)
          .expect(400);

        expect(response.body.message).toContain('User ID is required');
      });

      it('GET /api/assertion should return 400 when challenge is missing', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/assertion?userId=${userId}`)
          .expect(400);

        expect(response.body.message).toContain('Challenge is required');
      });

      it('GET /api/assertion should return 500 when user is not registered', async () => {
        const unregisteredUserId = 'unregistered@example.com';
        const challengeBytes = await blockHashChallenge(777, new Uint8Array([]));
        const challenge = '0x' + Buffer.from(challengeBytes).toString('hex');
        
        const response = await request(app.getHttpServer())
          .get(`/api/assertion?userId=${unregisteredUserId}&challenge=${challenge}`)
          .expect(500);

        expect(response.body.message).toContain('User data not found');
      });
    });

    describe('User Status Endpoints', () => {
      it('GET /api/check-user-registered should return false for unregistered user', async () => {
        const unregisteredUserId = 'unregistered@example.com';
        const response = await request(app.getHttpServer())
          .get(`/api/check-user-registered?userId=${unregisteredUserId}`)
          .expect(200);

        expect(response.body).toHaveProperty('ok');
        expect(response.body.ok).toBe(false);
      });

      it('GET /api/check-user-registered should return 400 when userId is missing', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/check-user-registered')
          .expect(400);

        expect(response.body.message).toContain('User ID is required');
      });

      it('GET /api/get-user-address should return 404 for unregistered user', async () => {
        const unregisteredUserId = 'unregistered@example.com';
        const response = await request(app.getHttpServer())
          .get(`/api/get-user-address?userId=${unregisteredUserId}`)
          .expect(404);

        expect(response.body.message).toContain('User not found or not registered');
      });

      it('GET /api/get-user-address should return 400 when userId is missing', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/get-user-address')
          .expect(400);

        expect(response.body.message).toContain('User ID is required');
      });
    });
  });
});
