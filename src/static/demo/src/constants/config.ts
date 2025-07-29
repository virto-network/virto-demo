export const DEFAULT_CONFIG = {
  SERVER_URL: 'https://vc.connect-test.xyz:5000',
  PROVIDER_URL: 'ws://localhost:21000',
  WALLET_TYPE: 'polkadotjs',
} as const;

export const ERROR_MESSAGES = {
  USER_ALREADY_REGISTERED: 'This user is already registered. Please sign in instead.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  INVALID_PROVIDER_URL: 'Provider URL not valid or not set.',
  SDK_INITIALIZATION_FAILED: 'Failed to initialize SDK',
} as const; 