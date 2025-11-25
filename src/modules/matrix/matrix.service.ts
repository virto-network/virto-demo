import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import * as sdk from 'matrix-js-sdk';

@Injectable()
export class MatrixService implements OnModuleInit {
  private readonly logger = new Logger(MatrixService.name);
  private client: any;
  private roomMembers: Set<string> = new Set();
  private roomId: string = '#kreivo:virto.community';
  private isReady: boolean = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeMatrixClient();
  }

  private async initializeMatrixClient() {
    try {
      const matrixUser = this.configService.getMatrixUser();
      const matrixPass = this.configService.getMatrixPass();
      const matrixHomeserver = this.configService.getMatrixHomeserver();

      this.logger.log(`Connecting to Matrix homeserver: ${matrixHomeserver}`);
      this.logger.log(`User: ${matrixUser}`);

      this.client = sdk.createClient({
        baseUrl: matrixHomeserver,
      });

      const loginResponse = await this.client.loginWithPassword(
        matrixUser,
        matrixPass,
      );

      this.logger.log(`Successfully logged in to Matrix as ${loginResponse.user_id}`);

      await this.client.startClient({ initialSyncLimit: 10 });

      await new Promise<void>((resolve) => {
        this.client.once('sync', (state: string) => {
          if (state === 'PREPARED') {
            this.logger.log('Matrix client is ready');
            resolve();
          }
        });
      });

      await this.loadRoomMembers();
      this.isReady = true;

      setInterval(() => {
        this.loadRoomMembers().catch(err => {
          this.logger.error('Error refreshing room members:', err);
        });
      }, 5 * 60 * 1000);

    } catch (error) {
      this.logger.error('Failed to initialize Matrix client:', error);
      throw error;
    }
  }

  private async loadRoomMembers() {
    try {
      let actualRoomId = this.roomId;
      
      if (this.roomId.startsWith('#')) {
        this.logger.log(`Resolving room alias: ${this.roomId}`);
        const roomAliasResponse = await this.client.getRoomIdForAlias(this.roomId);
        actualRoomId = roomAliasResponse.room_id;
        this.logger.log(`Resolved to room ID: ${actualRoomId}`);
      }

      const room = this.client.getRoom(actualRoomId);
      
      if (!room) {
        throw new Error(`Room ${this.roomId} not found. Make sure the bot user is a member of the room.`);
      }

      const members = room.getJoinedMembers();
      
      this.roomMembers.clear();
      members.forEach((member: any) => {
        this.roomMembers.add(member.userId);
        const username = member.userId.split(':')[0].replace('@', '');
        this.roomMembers.add(username);
        this.roomMembers.add(member.userId.replace('@', ''));
      });

      this.logger.log(`Loaded ${members.length} members from room ${this.roomId}`);
      this.logger.debug(`Members: ${Array.from(this.roomMembers).join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to load room members:', error);
      throw error;
    }
  }

  async isMember(username: string): Promise<boolean> {
    if (!this.isReady) {
      throw new Error('Matrix client is not ready yet');
    }

    if (this.roomMembers.has(username)) {
      return true;
    }

    if (this.roomMembers.has(`@${username}`)) {
      return true;
    }

    const matrixHomeserver = this.configService.getMatrixHomeserver();
    const domain = new URL(matrixHomeserver).hostname;
    
    if (this.roomMembers.has(`@${username}:${domain}`)) {
      return true;
    }

    const members: string[] = [];
    this.roomMembers.forEach(member => members.push(member));
    
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (member.includes(':')) {
        const [userPart] = member.split(':');
        if (userPart === `@${username}` || userPart === username) {
          return true;
        }
      }
    }

    return false;
  }

  getRoomMembers(): string[] {
    const members: string[] = [];
    this.roomMembers.forEach(member => members.push(member));
    return members;
  }

  isClientReady(): boolean {
    return this.isReady;
  }
}

