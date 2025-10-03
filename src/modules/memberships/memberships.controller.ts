import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { 
  CreateCommunityRequest, 
  CreateCommunityResponse, 
  AddMemberRequest, 
  AddMemberResponse,
  IsMemberResponse
} from './types';


@ApiTags('memberships')
@Controller('api/memberships')
export class MembershipsController {
  constructor(
    private readonly membershipsService: MembershipsService
  ) {}

  @Post('create-community')
  @ApiOperation({ summary: 'Create a new community in Kreivo chain' })
  @ApiResponse({ 
    status: 201, 
    description: 'Community created successfully'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async createCommunity(@Body() request: CreateCommunityRequest): Promise<CreateCommunityResponse> {
    try {
      if (!request.communityId || !request.name) {
        throw new HttpException(
          'Community ID and name are required',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.membershipsService.createCommunity(request);
      
      if (!result.success) {
        throw new HttpException(
          result.error || 'Failed to create community',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Error in createCommunity:', error);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('community-address/:communityId')
  @ApiOperation({ summary: 'Get community address by ID' })
  @ApiParam({ name: 'communityId', type: 'number', description: 'Community ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Community address retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        communityId: { type: 'number' },
        address: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid community ID' 
  })
  async getCommunityAddress(@Param('communityId') communityId: string) {
    try {
      const id = parseInt(communityId, 10);
      if (isNaN(id)) {
        throw new HttpException(
          'Invalid community ID',
          HttpStatus.BAD_REQUEST
        );
      }

      const address = await this.membershipsService.getCommunityAddress(id);
      
      return {
        communityId: id,
        address
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Error in getCommunityAddress:', error);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('create-community-with-membership')
  @ApiOperation({ summary: 'Create a new community and add creator as member' })
  @ApiResponse({ 
    status: 201, 
    description: 'Community created and membership added successfully'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async createCommunityWithMembership(@Body() request: CreateCommunityRequest): Promise<CreateCommunityResponse> {
    try {
      if (!request.communityId || !request.name) {
        throw new HttpException(
          'Community ID and name are required',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.membershipsService.createCommunityWithMembership(request);
      
      if (!result.success) {
        throw new HttpException(
          result.error || 'Failed to create community with membership',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Error in createCommunityWithMembership:', error);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('add-member')
  @ApiOperation({ summary: 'Add a member to a community' })
  @ApiResponse({ 
    status: 201, 
    description: 'Member added successfully'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async addMember(@Body() request: AddMemberRequest): Promise<AddMemberResponse> {
    try {
      if (!request.communityId || !request.memberAddress) {
        throw new HttpException(
          'Community ID and member address are required',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.membershipsService.addMember(request);
      
      if (!result.success) {
        throw new HttpException(
          result.error || 'Failed to add member',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Error in addMember:', error);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('is-member')
  @ApiOperation({ summary: 'Check if an address is a member of a community' })
  @ApiQuery({ name: 'communityId', type: 'number', description: 'Community ID' })
  @ApiQuery({ name: 'address', type: 'string', description: 'Member address to check' })
  @ApiResponse({ 
    status: 200, 
    description: 'Membership status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isMember: { type: 'boolean' },
        communityId: { type: 'number' },
        address: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid parameters' 
  })
  async isMember(
    @Query('communityId') communityId: string,
    @Query('address') address: string
  ): Promise<IsMemberResponse> {
    try {
      const id = parseInt(communityId, 10);
      if (isNaN(id) || !address) {
        throw new HttpException(
          'Valid community ID and address are required',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.membershipsService.isMember({
        communityId: id,
        address
      });
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Error in isMember:', error);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 