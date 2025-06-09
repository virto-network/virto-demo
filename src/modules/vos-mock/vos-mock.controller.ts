import { Controller, Post, Body, HttpException, HttpStatus, Req, Get, Query } from '@nestjs/common';
import { VosMockService } from './vos-mock.service';
import { BaseProfile, User } from './types';
import { Request } from 'express';
import { ApiPromise } from '@polkadot/api';
import { Pass } from './pass';
import { InMemorySessionStorage } from './storage';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';


@ApiTags('vos-mock')
@Controller('api')
@ApiTags('vos-mock')
@Controller('api')
export class VosMockController {
  constructor(private readonly vosMockService: VosMockService) {}

  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy', 
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2023-09-28T12:00:00Z' },
        service: { type: 'string', example: 'vos-mock' }
      }
    }
  })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  @Get('health')
  async healthCheck() {
    try {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'vos-mock'
      };
    } catch (error) {
      throw new HttpException('Service is unhealthy', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @ApiOperation({ summary: 'Initialize WebAuthn registration process' })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'User ID', example: 'test' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'User display name (defaults to id if not provided)', example: 'Test' })
  @ApiResponse({ 
    status: 200, 
    description: 'Registration initialization successful, returns attestation options',
    schema: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'object',
          properties: {
            rp: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Example RP' }
              }
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'array',
                  items: { type: 'integer' },
                  description: 'Hashed user ID as byte array',
                  example: [240, 228, 194, 247, 108, 88, 145, 110, 194, 88, 242, 70, 133, 27, 234, 9, 29, 20, 212, 36, 122, 47, 195, 225, 134, 148, 70, 27, 24, 22, 225, 59]
                },
                name: { type: 'string', example: 'test' },
                displayName: { type: 'string', example: 'test' }
              }
            },
            challenge: {
              type: 'string',
              example: '0x01d3f2ddb53e97c40a6b849f9c9258438fa40df3df34aa9028e5667e8a73721c'
            },
            pubKeyCredParams: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'public-key' },
                  alg: { type: 'integer', example: -7 }
                }
              }
            },
            authenticatorSelection: {
              type: 'object',
              properties: {
                userVerification: { type: 'string', example: 'preferred' }
              }
            },
            timeout: { type: 'number', example: 60000 },
            attestation: { type: 'string', example: 'none' }
          }
        },
        blockNumber: {
          type: 'number',
          description: 'Blockchain block number when the challenge was generated',
          example: 1107519
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid or missing user data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Get('attestation')
  async attestation(@Query('id') id: string, @Query('name') name: string, @Req() req: Request) {
    if (!id) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const storage = req.storage as InMemorySessionStorage;
      
      // Create a user object from query parameters
      const user: User<BaseProfile> = {
        profile: {
          id: id,
          name: name || id,
          displayName: name || id
        }
      };
      
      const attestationOptions = await this.vosMockService.attestation(user, api, pass, storage);
      return attestationOptions;
    } catch (error) {
      console.error('Attestation error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to prepare registration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ summary: 'Complete WebAuthn registration process' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID', example: 'test' },
        attestationResponse: { 
          type: 'object', 
          description: 'WebAuthn attestation response',
          properties: {
            id: { type: 'string', description: 'Credential ID as base64url string', example: 'yLbgoD7WL6UXBHpj5SZIOQw35XNk6z4Bz3BLSquG2HI' },
            rawId: { type: 'string', description: 'Raw credential ID as base64url string', example: 'yLbgoD7WL6UXBHpj5SZIOQw35XNk6z4Bz3BLSquG2HI' },
            type: { type: 'string', description: 'Type of credential', example: 'public-key' },
            response: {
              type: 'object',
              properties: {
                authenticatorData: { type: 'string', description: 'Base64url encoded authenticator data', example: 'SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NBAAAAAQAAAAAAAAAAAAAAAAAAAAAAIMi24KA-1i-lFwR6Y-UmSDkMN-VzZOs-Ac9wS0qrhthypQECAyYgASFYID57cUySgqw4bWodA5jLfVWGG55NfoHZ4_kc6rypYr1WIlgg_DAzXqVKpUTg95LctxL7274k4V7k31yuTKYSCjEGRhE' },
                clientDataJSON: { type: 'string', description: 'Base64url encoded client data JSON', example: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiQWRQeTNiVS1sOFFLYTRTZm5KSllRNC1rRGZQZk5LcVFLT1ZtZm9wemNodyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4NSIsImNyb3NzT3JpZ2luIjpmYWxzZX0' },
                publicKey: { type: 'string', description: 'Base64url encoded public key', example: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEPntxTJKCrDhtah0DmMt9VYYbnk1-gdnj-RzqvKlivVb8MDNepUqlROD3kty3EvvbviThXuTfXK5MphIKMQZGEQ' }
              }
            }
          }
        },
        blockNumber: { type: 'number', description: 'Blockchain block number from the attestation request', example: 1107519 }
      },
      required: ['userId', 'attestationResponse', 'blockNumber']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Registration completed successfully',
    schema: {
      type: 'object',
      properties: {
        ext: { type: 'string', description: 'Extrinsic data as hex string', example: '0xd107040600f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b006b726569766f5f700000000000000000000000000000000000000000000000000e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a83fe61000910249960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97634100000001000000000000000000000000000000000020c8b6e0a03ed62fa517047a63e52648390c37e57364eb3e01cf704b4aab86d872a50102032620012158203e7b714c9282ac386d6a1d0398cb7d55861b9e4d7e81d9e3f91ceabca962bd56225820fc30335ea54aa544e0f792dcb712fbdbbe24e15ee4df5cae4ca6120a3106461125027b2274797065223a22776562617574686e2e637265617465222c226368616c6c656e6765223a22416450793362552d6c38514b613453666e4a4a5951342d6b446650664e4b71514b4f566d666f707a636877222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303835222c2263726f73734f726967696e223a66616c73657d3059301306072a8648ce3d020106082a8648ce3d030107034200043e7b714c9282ac386d6a1d0398cb7d55861b9e4d7e81d9e3f91ceabca962bd56fc30335ea54aa544e0f792dcb712fbdbbe24e15ee4df5cae4ca6120a31064611' },
        address: { type: 'string', description: 'Address associated with the registration', example: 'alsdkfjalsdjkf' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('register')
  async register(@Body() body: { userId: string; attestationResponse: any; blockNumber: number }, @Req() req: Request) {
    const { userId, attestationResponse, blockNumber } = body;
    
    if (!userId || !attestationResponse || blockNumber === undefined) {
      throw new HttpException('User ID, attestation response, and block number are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const storage = req.storage as InMemorySessionStorage;
      
      // Update the stored block number from the request
      const storedData = storage.get(userId);
      if (storedData) {
        storage.set(userId, { ...storedData });
      }
      
      const result = await this.vosMockService.register(userId, attestationResponse, api, pass, blockNumber, storage);
      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed during registration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ summary: 'Initialize WebAuthn authentication process' })
  @ApiQuery({ name: 'userId', required: true, type: String, description: 'User ID for which to generate authentication assertion', example: 'test' })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication initialization successful, returns assertion options',
    schema: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'object',
          properties: {
            challenge: { 
              type: 'string', 
              description: 'Challenge as hex string',
              example: '0xd9c7d5339e935d1ef6b44949972ef5aaa373cd29ba16beb5edcc93acd9ce9667'
            },
            allowCredentials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Credential ID', example: 'yLbgoD7WL6UXBHpj5SZIOQw35XNk6z4Bz3BLSquG2HI' },
                  type: { type: 'string', example: 'public-key' },
                  transports: { 
                    type: 'array', 
                    items: { type: 'string' },
                  }
                }
              }
            },
            userVerification: { type: 'string', example: 'preferred' },
            timeout: { type: 'number', example: 60000 }
          }
        },
        blockNumber: {
          type: 'number',
          description: 'Blockchain block number when the challenge was generated',
          example: 1107521
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - User ID is required or User data not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Get('assertion')
  async assertion(@Query('userId') userId: string, @Req() req: Request) {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const storage = req.storage as InMemorySessionStorage;
      const assertionOptions = await this.vosMockService.assertion(userId, api, pass, storage);
      return assertionOptions;
    } catch (error) {
      console.error('Assertion error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to prepare connection',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ summary: 'Complete WebAuthn authentication process' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID', example: 'test' },
        assertionResponse: { 
          type: 'object', 
          description: 'WebAuthn assertion response',
          properties: {
            id: { type: 'string', description: 'Credential ID as base64url string', example: 'yLbgoD7WL6UXBHpj5SZIOQw35XNk6z4Bz3BLSquG2HI' },
            rawId: { type: 'string', description: 'Raw credential ID as base64url string', example: 'yLbgoD7WL6UXBHpj5SZIOQw35XNk6z4Bz3BLSquG2HI' },
            type: { type: 'string', description: 'Type of credential', example: 'public-key' },
            response: {
              type: 'object',
              properties: {
                authenticatorData: { type: 'string', description: 'Base64url encoded authenticator data', example: 'SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MBAAAAAg' },
                clientDataJSON: { type: 'string', description: 'Base64url encoded client data JSON', example: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiMmNmVk01NlRYUjcydEVsSmx5NzFxcU56elNtNkZyNjE3Y3lUck5uT2xtYyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4NSIsImNyb3NzT3JpZ2luIjpmYWxzZSwib3RoZXJfa2V5c19jYW5fYmVfYWRkZWRfaGVyZSI6ImRvIG5vdCBjb21wYXJlIGNsaWVudERhdGFKU09OIGFnYWluc3QgYSB0ZW1wbGF0ZS4gU2VlIGh0dHBzOi8vZ29vLmdsL3lhYlBleCJ9' },
                signature: { type: 'string', description: 'Base64url encoded signature', example: 'MEQCIBADT7Cz8Lk9hb8NR6EoQDEutSeBBsO5Qm_7kMtyu5nVAiBZHLwvgo4K72PIGwNklpef7bCjbfk1HXijpGBL0lFG-g' }
              }
            }
          }
        },
        blockNumber: { 
          type: 'number', 
          description: 'Blockchain block number from the assertion request',
          example: 1107521
        }
      },
      required: ['userId', 'assertionResponse', 'blockNumber']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication completed successfully',
    schema: {
      type: 'object',
      properties: {
        command: {
          type: 'object',
          properties: {
            url: { 
              type: 'string', 
              description: 'WebSocket URL for the command',
              example: 'ws://localhost:12281/pass/authenticate'
            },
            body: { 
              type: 'array', 
              description: 'Arguments for the transaction',
              example: [
                "0x0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8",
                {
                  "webAuthn": {
                    "meta": {
                      "authorityId": "0x6b726569766f5f70000000000000000000000000000000000000000000000000",
                      "userId": "0xf0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b",
                      "context": 1107521
                    },
                    "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630100000002",
                    "clientData": "0x7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22326366564d3536545852373274456c4a6c79373171714e7a7a536d364672363137637954724e6e4f6c6d63222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303835222c2263726f73734f726967696e223a66616c73652c226f746865725f6b6579735f63616e5f62655f61646465645f68657265223a22646f206e6f7420636f6d7061726520636c69656e74446174614a534f4e20616761696e737420612074656d706c6174652e205365652068747470733a2f2f676f6f2e676c2f796162506578227d",
                    "signature": "0x3044022010034fb0b3f0b93d85bf0d47a12840312eb5278106c3b9426ffb90cb72bb99d50220591cbc2f828e0aef63c81b036496979fedb0a36df9351d78a3a4604bd25146fa"
                  }
                },
                null
              ]
            },
            hex: { 
              type: 'string', 
              description: 'Extrinsic as hex string',
              example: "0x06030e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8006b726569766f5f70000000000000000000000000000000000000000000000000f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b41e610009449960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630100000002cd037b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22326366564d3536545852373274456c4a6c79373171714e7a7a536d364672363137637954724e6e4f6c6d63222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303835222c2263726f73734f726967696e223a66616c73652c226f746865725f6b6579735f63616e5f62655f61646465645f68657265223a22646f206e6f7420636f6d7061726520636c69656e74446174614a534f4e20616761696e737420612074656d706c6174652e205365652068747470733a2f2f676f6f2e676c2f796162506578227d19013044022010034fb0b3f0b93d85bf0d47a12840312eb5278106c3b9426ffb90cb72bb99d50220591cbc2f828e0aef63c81b036496979fedb0a36df9351d78a3a4604bd25146fa00"
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required parameters or User data not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('connect')
  async connect(@Body() body: { userId: string; assertionResponse: any; blockNumber: number }, @Req() req: Request) {
    const { userId, assertionResponse, blockNumber } = body;
    
    if (!userId || !assertionResponse || blockNumber === undefined) {
      throw new HttpException('User ID, assertion response, and block number are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const storage = req.storage as InMemorySessionStorage;
      
      // Update the stored block number from the request
      const storedData = storage.get(userId);
      if (storedData) {
        storage.set(userId, { ...storedData });
      }
      
      const result = await this.vosMockService.connect(userId, assertionResponse, api, pass, blockNumber, storage);
      return result;
    } catch (error) {
      console.error('Connect error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed during authentication',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ summary: 'Check if a user is registered with WebAuthn' })
  @ApiQuery({ name: 'userId', required: true, type: String, description: 'User ID to check if registered', example: 'test' })
  @ApiResponse({ 
    status: 200, 
    description: 'Check completed successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', description: 'Indicates if the user is registered', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Get('check-user-registered')
  async checkUserRegistered(@Query('userId') userId: string, @Req() req: Request) {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    console.log("checkUserRegistered", userId);

    try {
      const storage = req.storage as InMemorySessionStorage;
      console.log("storage", storage);
      const storedData = storage.get(userId);
      return { ok: !!storedData && !!storedData.credentialId };
    } catch (error) {
      console.error('Check user registered error:', error);
      throw new HttpException(
        'Failed to check user registration status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}