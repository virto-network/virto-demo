export type DecisionMethod =
  | {
      type: "Membership";
    }
  | {
      type: "Rank";
    }
  | {
      type: "NativeToken";
    }
  | {
      type: "CommunityAsset";
      id: any;
      minVote: number;
    };

export interface CreateCommunityRequest {
  communityId: number;
  name: string;
  decisionMethod: DecisionMethod;
}

export interface CreateCommunityResponse {
  success: boolean;
  communityId: number;
  address: string;
  txHash?: string;
  blockHash?: string;
  error?: string;
}

export interface CommunityInfo {
  id: number;
  name: string;
  decisionMethod: DecisionMethod;
  address: string;
  createdAt: Date;
}

export interface AddMemberRequest {
  communityId: number;
  memberAddress: string;
}

export interface AddMemberResponse {
  success: boolean;
  communityId: number;
  memberAddress: string;
  txHash?: string;
  blockHash?: string;
  error?: string;
}

export interface IsMemberRequest {
  communityId: number;
  address: string;
}

export interface IsMemberResponse {
  isMember: boolean;
  communityId: number;
  address: string;
} 