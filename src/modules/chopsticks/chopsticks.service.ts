import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ApiPromise } from '@polkadot/api';
import { BuildBlockMode, ChopsticksProvider, setStorage, setupWithServer } from '@acala-network/chopsticks';

interface SessionData {
  close: Function;
  port: number;
  api: ApiPromise | null;
}

@Injectable()
export class ChopsticksService implements OnModuleDestroy {
  private sessions: Record<string, SessionData> = {};
  private basePort = 9910;

  constructor() {}

  onModuleDestroy() {
    // Cleanup all active sessions when the module is destroyed
    Object.keys(this.sessions).forEach((sessionId) => {
      this.stopChopsticks(sessionId).catch(err => {
        console.error(`Failed to close session ${sessionId}:`, err);
      });
    });
  }

  private findAvailablePort(): number {
    const port = this.basePort;
    this.basePort += 1;
    return port;
  }

  private async stepOneBlock(url: string) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'dev_newBlock',
          params: [{ count: 1 }]
        })
      });

      const data = await response.json();
      console.log('Block step response:', data);
      return data;
    } catch (error) {
      console.error('Error stepping block:', error);
      throw error;
    }
  }

  async startChopsticks(sessionId: string, endpoint: string): Promise<{ sessionId: string, port: number }> {
    // If session already exists, return it
    if (this.sessions[sessionId]) {
      return {
        port: this.sessions[sessionId].port,
        sessionId
      };
    }

    const port = this.findAvailablePort();

    const { chain, addr, close } = await setupWithServer({
      'build-block-mode': BuildBlockMode.Instant,
      endpoint,
      port,
      'runtime-log-level': 3,
      host: '0.0.0.0',
    });

    const publicIp = process.env.PUBLIC_IP || "0.0.0.0";
    console.log({ publicIp, addr });

    const provider = new ChopsticksProvider(chain);
    const api = await ApiPromise.create({ provider });
    await api.isReady;

    // Set initial account with funds
    await setStorage(chain, {
      System: {
        Account: [
          [
            ["5DS4XWXWzAimdj8GR5w1ZepsUZUUPN96YxL8LEaWa3GRUKfC"],
            {
              nonce: 0,
              consumers: 0,
              providers: 1,
              sufficients: 0,
              data: {
                free: 2000000000000,
                reserved: 0,
                frozen: 0,
                flags: 0,
              },
            },
          ],
        ],
      },
    });

    // Set community memberships
    await setStorage(chain, {
      CommunityMemberships: {
        Account: [
          [
            ["5DS4XWXWzAimdj8GR5w1ZepsUZUUPN96YxL8LEaWa3GRUKfC", 0, 5],
            null
          ]
        ],
        Item: [
          [
            [0, 5],
            {
              owner: "5DS4XWXWzAimdj8GR5w1ZepsUZUUPN96YxL8LEaWa3GRUKfC",
              approvals: {},
              deposit: {
                account: "F3opxRbN5ZbjJNU511Kj2TLuzFcDq9BGduA9TgiECafpg29",
                amount: 0
              }
            }
          ]
        ]
      }
    });

    // Schedule a task for the next block
    const currentBlock = chain.head.number;
    const nextBlock = currentBlock + 1;

    await setStorage(chain, {
      Scheduler: {
        Agenda: [
          [
            [nextBlock],
            [
              {
                call: {
                  Inline: "0x4b02000005000000010730f96342030200e00001c0890100"
                },
                origin: {
                  System: "Root"
                }
              }
            ]
          ]
        ]
      }
    });

    await this.stepOneBlock(`http://localhost:${port}`);

    this.sessions[sessionId] = {
      close,
      port,
      api
    };

    // Set up a timeout to close the session after 1 hour
    setTimeout(async () => {
      if (!this.sessions[sessionId]) return;
      await this.stopChopsticks(sessionId);
      console.log(`Session ${sessionId} closed after 1 hour timeout`);
      delete this.sessions[sessionId];
    }, 60 * 60 * 1000); // 1 hour in milliseconds

    return {
      sessionId,
      port,
    };
  }

  getSessionInfo(sessionId: string): { sessionId: string, port: number } | null {
    if (!this.sessions[sessionId]) {
      return null;
    }

    return {
      sessionId,
      port: this.sessions[sessionId].port
    };
  }

  async stopChopsticks(sessionId: string): Promise<boolean> {
    if (!this.sessions[sessionId]) {
      return false;
    }

    const { close, api } = this.sessions[sessionId];

    if (api) {
      try {
        await api.disconnect();
      } catch (e) {
        console.warn('API disconnect error:', e);
      }
    }

    close();
    delete this.sessions[sessionId];
    return true;
  }
} 