import SDK from '@virtonetwork/sdk';
import type { IAuthService, User, SDKConfig } from '@/types/auth.types';
import { DEFAULT_CONFIG, ERROR_MESSAGES } from '@/constants/config';

export class AuthService implements IAuthService {
  private sdk: SDK | null = null;
  private config: SDKConfig;

  constructor(config: Partial<SDKConfig> = {}) {
    this.config = {
      federate_server: config.federate_server || DEFAULT_CONFIG.SERVER_URL,
      provider_url: config.provider_url || DEFAULT_CONFIG.PROVIDER_URL,
      config: {
        wallet: config.config?.wallet || DEFAULT_CONFIG.WALLET_TYPE,
      },
    };
  }

  public initializeSDK(): void {
    console.trace('INIT SDK with', this.config.provider_url);

    if (!this.config.provider_url || this.config.provider_url.includes('127.0.0.1:9944')) {
      console.warn(ERROR_MESSAGES.INVALID_PROVIDER_URL);
      return;
    }

    try {
      this.sdk = new SDK(this.config);
      console.log(`Virto SDK initialized with server: ${this.config.federate_server} and provider: ${this.config.provider_url}`);
    } catch (error) {
      console.error(ERROR_MESSAGES.SDK_INITIALIZATION_FAILED, error);
      throw new Error(ERROR_MESSAGES.SDK_INITIALIZATION_FAILED);
    }
  }

  public async isRegistered(username: string): Promise<boolean> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }
    
    return await this.sdk.auth.isRegistered(username);
  }

  public async register(user: User): Promise<any> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    console.log('Attempting to register user:', user);
    const result = await this.sdk.auth.register(user);
    console.log('Registration successful:', result);
    return result;
  }

  public async login(username: string): Promise<any> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    console.log('Attempting to login user:', username);
    const result = await this.sdk.auth.login(username);
    console.log('Login successful:', result);
    return result;
  }

  public async logout(): Promise<void> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    await this.sdk.auth.logout();
    console.log('Logout successful');
  }

  public getSDK(): SDK | null {
    return this.sdk;
  }

  public updateConfig(newConfig: Partial<SDKConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Re-initialize SDK with new config
    this.initializeSDK();
  }
} 