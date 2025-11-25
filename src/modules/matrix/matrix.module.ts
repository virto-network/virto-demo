import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { MatrixController } from './matrix.controller';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [MatrixController],
  providers: [MatrixService],
  exports: [MatrixService],
})
export class MatrixModule {}

