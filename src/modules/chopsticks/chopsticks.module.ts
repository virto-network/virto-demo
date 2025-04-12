import { Module } from '@nestjs/common';
import { ChopsticksController } from './chopsticks.controller';
import { ChopsticksService } from './chopsticks.service';

@Module({
  controllers: [ChopsticksController],
  providers: [ChopsticksService],
  exports: [ChopsticksService],
})
export class ChopsticksModule {} 