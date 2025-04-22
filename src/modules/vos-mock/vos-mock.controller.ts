import { Controller, Post, Body, HttpException, HttpStatus, Req, Get } from '@nestjs/common';
import { VosMockService } from './vos-mock.service';
import { BaseProfile, User } from './types';
import { Request } from 'express';
import { ApiPromise } from '@polkadot/api';
import { Pass } from './pass';
import { InMemorySessionStorage } from './storage';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';


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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            name: { type: 'string', description: 'User name' }
          },
          required: ['id']
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Registration initialization successful, returns attestation options' })
  @ApiResponse({ status: 400, description: 'Bad request - User ID is required' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('pre-register')
  async preRegister(@Body() user: User<BaseProfile, Record<string, unknown>>, @Req() req: Request) {

    if (!user?.profile?.id) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const storage = req.storage as InMemorySessionStorage;
      const attestationOptions = await this.vosMockService.preRegister(user, api, pass, storage);
      return attestationOptions;
    } catch (error) {
      console.error('Pre-register error:', error);
      throw new HttpException('Failed to prepare registration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Complete WebAuthn registration process' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
        attestationResponse: { 
          type: 'object', 
          description: 'WebAuthn attestation response'
        }
      },
      required: ['userId', 'attestationResponse']
    }
  })
  @ApiResponse({ status: 200, description: 'Registration completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('post-register')
  async postRegister(@Body() body: { userId: string; attestationResponse: any }, @Req() req: Request) {
    const { userId, attestationResponse } = body;
    
    if (!userId || !attestationResponse) {
      throw new HttpException('User ID and attestation response are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const storage = req.storage as InMemorySessionStorage;
      const result = await this.vosMockService.postRegister(userId, attestationResponse, api, pass, storage);
      return result;
    } catch (error) {
      console.error('Post-register error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed during registration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ summary: 'Initialize WebAuthn authentication process' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' }
      },
      required: ['userId']
    }
  })
  @ApiResponse({ status: 200, description: 'Authentication initialization successful, returns assertion options' })
  @ApiResponse({ status: 400, description: 'Bad request - User ID is required' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('pre-connect')
  async preConnect(@Body() body: { userId: string }, @Req() req: Request) {
    const { userId } = body;
    
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const storage = req.storage as InMemorySessionStorage;
      const assertionOptions = await this.vosMockService.preConnect(userId, api, pass, storage);
      return assertionOptions;
    } catch (error) {
      console.error('Pre-connect error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to prepare connection',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ summary: 'Complete WebAuthn authentication process and establish session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
        assertionResponse: { 
          type: 'object', 
          description: 'WebAuthn assertion response' 
        }
      },
      required: ['userId', 'assertionResponse']
    }
  })
  @ApiResponse({ status: 200, description: 'Authentication completed successfully and session established' })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('pre-connect-session')
  async postConnect(@Body() body: { userId: string; assertionResponse: any }, @Req() req: Request) {
    const { userId, assertionResponse } = body;
    
    if (!userId || !assertionResponse) {
      throw new HttpException('User ID and assertion response are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const storage = req.storage as InMemorySessionStorage;
      console.log(api, pass);
      const result = await this.vosMockService.postConnect(userId, assertionResponse, api, pass, storage);
      return result;
    } catch (error) {
      console.error('Post-connect error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed during authentication',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}