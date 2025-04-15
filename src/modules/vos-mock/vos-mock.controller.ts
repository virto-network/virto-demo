import { Controller, Post, Body, HttpException, HttpStatus, Req, Get } from '@nestjs/common';
import { VosMockService } from './vos-mock.service';
import { BaseProfile, User } from './types';
import { Request } from 'express';
import { ApiPromise } from '@polkadot/api';
import { Pass } from './pass';

@Controller('api')
export class VosMockController {
  constructor(private readonly vosMockService: VosMockService) {}
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
  @Post('pre-register')
  async preRegister(@Body() user: User<BaseProfile, Record<string, unknown>>, @Req() req: Request) {
    console.log("preRegister", user);

    if (!user?.profile?.id) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    console.log("preRegister", user.profile.id);

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const attestationOptions = await this.vosMockService.preRegister(user, api, pass);
      return attestationOptions;
    } catch (error) {
      console.error('Pre-register error:', error);
      throw new HttpException('Failed to prepare registration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('post-register')
  async postRegister(@Body() body: { userId: string; attestationResponse: any }, @Req() req: Request) {
    const { userId, attestationResponse } = body;
    
    if (!userId || !attestationResponse) {
      throw new HttpException('User ID and attestation response are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const result = await this.vosMockService.postRegister(userId, attestationResponse, api, pass);
      return result;
    } catch (error) {
      console.error('Post-register error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed during registration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('pre-connect')
  async preConnect(@Body() body: { userId: string }, @Req() req: Request) {
    const { userId } = body;
    
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      const assertionOptions = await this.vosMockService.preConnect(userId, api, pass);
      return assertionOptions;
    } catch (error) {
      console.error('Pre-connect error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to prepare connection',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('pre-connect-session')
  async postConnect(@Body() body: { userId: string; assertionResponse: any }, @Req() req: Request) {
    const { userId, assertionResponse } = body;
    
    if (!userId || !assertionResponse) {
      throw new HttpException('User ID and assertion response are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const api = req.api as ApiPromise;
      const pass = req.pass as Pass;
      console.log(api, pass);
      const result = await this.vosMockService.postConnect(userId, assertionResponse, api, pass);
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