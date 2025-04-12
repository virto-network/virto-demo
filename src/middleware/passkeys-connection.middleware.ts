import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ChopsticksService } from '../modules/chopsticks/chopsticks.service';
import { Pass } from '../modules/vos-mock/pass';

@Injectable()
export class PasskeysConnectionMiddleware implements NestMiddleware {
  private connectionCache = new Map<string, { 
    api: ApiPromise; 
    pass: Pass;
    timeout: NodeJS.Timeout;
  }>();

  private readonly CACHE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  constructor(private chopsticksService: ChopsticksService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    console.log("PasskeysConnectionMiddleware use");
    try {
        console.log("cookie", req.cookies);

      // Extract sessionId or wsUrl from query parameters, headers, or body
      const sessionId = req.query.sessionId as string || 
                        req.headers['x-session-id'] as string || 
                        (req.body && req.body.sessionId) ||
                        req.cookies.sessionId;
                        
      const wsUrl = req.query.wsUrl as string || 
                    req.headers['x-ws-url'] as string || 
                    (req.body && req.body.wsUrl) ||
                    req.cookies.wsUrl;

        console.log("sessionId", sessionId);
        console.log("wsUrl", wsUrl);
      if (!sessionId && !wsUrl) {
        // No connection parameters provided, continue without passkeys connection
        return next();
      }

      const cacheKey = sessionId || wsUrl;
      let connection = this.connectionCache.get(cacheKey);

      console.log("connection", connection);
      if (!connection) {
        if (sessionId) {
          // Get session info from chopsticks service
          const sessionInfo = this.chopsticksService.getSessionInfo(sessionId);
          
          if (!sessionInfo) {
            res.status(404).json({ error: 'Session not found' });
            return;
          }

          const host = 'ws://127.0.0.1';
          const port = sessionInfo.port;
          const wsUrl = `${host}:${port}`;

          console.log("wsUrl", wsUrl);

          // Create API instance and Pass object
          const api = await ApiPromise.create({ provider: new WsProvider(wsUrl) });
          const pass = new Pass(wsUrl, api);
          
          // Create timeout to clear cache after 2 hours
          const timeout = setTimeout(async () => {
            const conn = this.connectionCache.get(cacheKey);
            if (conn) {
              await conn.api.disconnect();
              this.connectionCache.delete(cacheKey);
            }
          }, this.CACHE_TIMEOUT);

          connection = { api, pass, timeout };
          this.connectionCache.set(sessionId, connection);

        } else if (wsUrl) {
          // Create API instance directly from provided WS URL
          const api = await ApiPromise.create({ provider: new WsProvider(wsUrl) });
          const pass = new Pass(wsUrl, api);

          // Create timeout to clear cache after 2 hours
          const timeout = setTimeout(async () => {
            const conn = this.connectionCache.get(cacheKey);
            if (conn) {
              await conn.api.disconnect();
              this.connectionCache.delete(cacheKey);
            }
          }, this.CACHE_TIMEOUT);

          connection = { api, pass, timeout };
          this.connectionCache.set(wsUrl, connection);
        }
      }

      // Attach cached connection to request for use in controllers
      req['api'] = connection.api;
      req['pass'] = connection.pass;
      
      next();
    } catch (error) {
      console.error('Error in passkeys connection middleware:', error);
      res.status(500).json({ error: 'Internal server error in passkeys middleware' });
    }
  }
}