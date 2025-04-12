import { ApiPromise } from '@polkadot/api';
import { Pass } from '../modules/vos-mock/pass';

declare global {
  namespace Express {
    interface Request {
      api?: ApiPromise;
      pass?: Pass;
    }
  }
} 