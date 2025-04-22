import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ChopsticksModule } from './modules/chopsticks/chopsticks.module';
import { VosMockModule } from './modules/vos-mock/vos-mock.module';
import { ConfigModule } from './config/config.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { PasskeysConnectionMiddleware } from './middleware/passkeys-connection.middleware';
import { ApiDocsModule } from './modules/api-docs/api-docs.module';

dotenv.config();

@Module({
  imports: [
    ServeStaticModule.forRoot({
      serveRoot: '/',
      rootPath: join(__dirname, 'static'),
    }),
    ChopsticksModule,
    VosMockModule,
    ConfigModule,
    ApiDocsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PasskeysConnectionMiddleware)
      .forRoutes(
        'api/pre-register',
        'api/post-register',
        'api/pre-connect',
        'api/pre-connect-session'
      );
  }
} 