import { Module, forwardRef } from '@nestjs/common';
import { VosMockController } from './vos-mock.controller';
import { VosMockService } from './vos-mock.service';
import { StorageMiddleware } from './storage.middleware';
import { ConfigModule } from '../../config/config.module';
import { MatrixModule } from '../matrix/matrix.module';

@Module({
  imports: [ConfigModule, forwardRef(() => MatrixModule)],
  controllers: [VosMockController],
  providers: [VosMockService, StorageMiddleware],
  exports: [VosMockService],
})
export class VosMockModule {} 