import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor() {
    const envFilePath = '.env';
    const envFileExists = fs.existsSync(envFilePath);

    this.envConfig = dotenv.parse(envFileExists ? fs.readFileSync(envFilePath) : '');
  }

  get(key: string): string {
    return this.envConfig[key] || process.env[key];
  }

  getPort(): number {
    return parseInt(this.get('PORT') || '3000', 10);
  }

  getNodeEnv(): string {
    return this.get('NODE_ENV') || 'development';
  }

  getKreivoProvider(): string {
    return this.get('KREIVO_PROVIDER');
  }

  getWsProviderUrl(): string {
    return this.get('WS_PROVIDER_URL');
  }

  getSeed(): string {
    return this.get('SEED');
  }

  getPublicIp(): string {
    return this.get('PUBLIC_IP');
  }

  getRpName(): string {
    return this.get('RP_NAME');
  }

  getSigningServiceUrl(): string {
    return this.get('SIGNING_SERVICE_URL');
  }
}
