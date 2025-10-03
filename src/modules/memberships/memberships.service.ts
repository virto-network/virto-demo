import { Injectable } from '@nestjs/common';
import { WsProvider, ApiPromise } from "@polkadot/api";
import { ConfigService } from '../../config/config.service';
import { kreivo, MultiAddress } from "@polkadot-api/descriptors";
import { createClient, Binary } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { polkadotSigner, publicAddress } from '../vos-mock/signer';
import { polkadotSigner as adminSigner, publicAddress as adminAddress } from './utils/signer';
import {
  communityAccountInKreivo,
} from "./utils/community-account-ids";
import { 
  CreateCommunityRequest, 
  CreateCommunityResponse, 
  DecisionMethod,
  AddMemberRequest,
  AddMemberResponse,
  IsMemberRequest,
  IsMemberResponse
} from './types';

@Injectable()
export class MembershipsService {
  constructor(private readonly configService: ConfigService) {}

  async createCommunity(
    request: CreateCommunityRequest
  ): Promise<CreateCommunityResponse> {
    try {
      const tx = await this.createCommunityInKreivo(
        request.communityId,
        request.name,
        request.decisionMethod
      );

      const result = await new Promise<{ txHash: string; blockHash: string }>((resolve, reject) => {
        tx.signSubmitAndWatch(adminSigner)
          .subscribe({
            next: (event) => {
              console.info('Create community transaction event:', event.type);
              if (event.type === 'txBestBlocksState') {
                resolve({ 
                  txHash: event.txHash, 
                  blockHash: event.found?.toString() || '' 
                });
              }
            },
            error: (error) => {
              console.error('Create community transaction error:', error);
              reject(error);
            }
          });
      });

      const address = await this.getCommunityAddress(request.communityId);

      return {
        success: true,
        communityId: request.communityId,
        address,
        txHash: result.txHash,
        blockHash: result.blockHash
      };
    } catch (error) {
      console.error('Error creating community:', error);
      const address = await this.getCommunityAddress(request.communityId);
      return {
        success: false,
        communityId: request.communityId,
        address,
        error: error.message
      };
    }
  }

  async getCommunityAddress(communityId: number): Promise<string> {
    const kreivoApi = await ApiPromise.create({
      provider: new WsProvider(this.configService.getKreivoProvider()),
    });

    return await communityAccountInKreivo(kreivoApi, communityId);
  }

  private async createCommunityInKreivo(
    communityId: number,
    name: string,
    decisionMethod: DecisionMethod
  ) {
    const client = createClient(
      getWsProvider(this.configService.getKreivoProvider())
    );

    const kreivoApi = client.getTypedApi(kreivo);

    let encodedDecisionMethod;
    switch (decisionMethod.type) {
      case "Rank":
        encodedDecisionMethod = { type: "Rank" };
        break;
      case "NativeToken":
        encodedDecisionMethod = { type: "NativeToken" };
        break;
      case "CommunityAsset":
        encodedDecisionMethod = { 
          type: "CommunityAsset", 
          value: [decisionMethod.id, decisionMethod.minVote] 
        };
        break;
      default:
        encodedDecisionMethod = { type: "Membership" };
        break;
    }

    const createCommunity = kreivoApi.tx.CommunitiesManager.register({
      community_id: communityId,
      name: Binary.fromText(name),
      first_admin: MultiAddress.Id(adminAddress),
      maybe_decision_method: encodedDecisionMethod,
      maybe_track_info: undefined
    });

    return createCommunity;
  }

  async addMember(
    request: AddMemberRequest
  ): Promise<AddMemberResponse> {
    try {
      const client = createClient(
        getWsProvider(this.configService.getKreivoProvider())
      );

      const kreivoApi = client.getTypedApi(kreivo);

      const addMembership = kreivoApi.tx.Communities.add_member({
        who: MultiAddress.Id(request.memberAddress),
      }).decodedCall;

      const transfer = kreivoApi.tx.Balances.transfer_keep_alive({
        dest: MultiAddress.Id(request.memberAddress),
        value: BigInt("100000000000"),
      }).decodedCall;

      const addMemberTx = kreivoApi.tx.Utility.batch_all({
        calls: [
          addMembership,
          transfer,
        ],
      });

      const result = await new Promise<{ txHash: string; blockHash: string }>((resolve, reject) => {
        addMemberTx.signSubmitAndWatch(adminSigner)
          .subscribe({
            next: (event) => {
              console.info('Add member transaction event:', event.type);
              if (event.type === 'txBestBlocksState') {
                resolve({ 
                  txHash: event.txHash, 
                  blockHash: event.found?.toString() || '' 
                });
              }
            },
            error: (error) => {
              console.error('Add member transaction error:', error);
              reject(error);
            }
          });
      });

      return {
        success: true,
        communityId: request.communityId,
        memberAddress: request.memberAddress,
        txHash: result.txHash,
        blockHash: result.blockHash
      };
    } catch (error) {
      console.error('Error adding member:', error);
      return {
        success: false,
        communityId: request.communityId,
        memberAddress: request.memberAddress,
        error: error.message
      };
    }
  }

  async isMember(request: IsMemberRequest): Promise<IsMemberResponse> {
    try {
      const client = createClient(
        getWsProvider(this.configService.getKreivoProvider())
      );

      const kreivoApi = client.getTypedApi(kreivo);

      const membershipKeys = await kreivoApi.query.CommunityMemberships.Account.getEntries(
        request.address, 
        request.communityId
      );

      console.log({ membershipKeys });

      return {
        isMember: membershipKeys.length > 0,
        communityId: request.communityId,
        address: request.address
      };
    } catch (error) {
      console.error('Error checking membership:', error);
      return {
        isMember: false,
        communityId: request.communityId,
        address: request.address
      };
    }
  }

  async createCommunityWithMembership(
    request: CreateCommunityRequest
  ): Promise<CreateCommunityResponse> {
    try {
      const createResult = await this.createCommunity(request);
      
      if (!createResult.success) {
        return createResult;
      }

      const addMemberResult = await this.addMember({
        communityId: request.communityId,
        memberAddress: publicAddress
      });

      if (!addMemberResult.success) {
        console.warn('Community created but failed to add creator as member:', addMemberResult.error);
      }

      return {
        ...createResult,
      };
    } catch (error) {
      console.error('Error creating community with membership:', error);
      const address = await this.getCommunityAddress(request.communityId);
      return {
        success: false,
        communityId: request.communityId,
        address,
        error: error.message
      };
    }
  }
}
