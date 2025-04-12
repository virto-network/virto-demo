import { Module } from '@nestjs/common';
import { VosMockController } from './vos-mock.controller';
import { VosMockService } from './vos-mock.service';
import { PasskeysService } from './passkeys.service';

@Module({
  imports: [],
  controllers: [VosMockController],
  providers: [VosMockService, PasskeysService],
  exports: [VosMockService, PasskeysService],
})
export class VosMockModule {} 