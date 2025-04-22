import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ChopsticksService } from './chopsticks.service';
import { v4 as uuidv4 } from 'uuid';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('chopsticks')
export class ChopsticksController {
  constructor(private readonly chopsticksService: ChopsticksService) {}

  @Post('start')
  async startChopsticks(@Body() body: { sessionId?: string, endpoint?: string }) {
    try {
      const { sessionId = uuidv4(), endpoint = 'wss://kreivo.kippu.rocks' } = body;
      console.log("startChopsticks", sessionId, endpoint);
      const result = await this.chopsticksService.startChopsticks(sessionId, endpoint);
      console.log("startChopsticks result", result);
      return result;
    } catch (error) {
      throw new HttpException('Cant initialize Chopsticks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('session/:sessionId')
  async getSessionInfo(@Param('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new HttpException('Session ID is required', HttpStatus.BAD_REQUEST);
    }

    const sessionInfo = this.chopsticksService.getSessionInfo(sessionId);
    if (!sessionInfo) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    return sessionInfo;
  }

  @Post('stop')
  async stopChopsticks(@Body() body: { sessionId: string }) {
    const { sessionId } = body;
    if (!sessionId) {
      throw new HttpException('Session ID is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.chopsticksService.stopChopsticks(sessionId);
    if (!result) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    return { success: true };
  }
}