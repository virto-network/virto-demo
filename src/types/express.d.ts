import { ApiPromise } from '@polkadot/api';
import { Pass } from '../modules/vos-mock/pass';
import { InMemorySessionStorage } from '@/modules/vos-mock/storage';

declare global {
  namespace Express {
    interface Request {
      api?: ApiPromise;
      pass?: Pass;
      storage?: InMemorySessionStorage;
    }
  }
} 