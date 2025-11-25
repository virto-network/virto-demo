import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MatrixService } from './matrix.service';

@ApiTags('Matrix')
@Controller('api/matrix')
export class MatrixController {
  constructor(private readonly matrixService: MatrixService) {}

  @Get('check-member')
  @ApiOperation({ 
    summary: 'Check if a user is a member of the Kreivo Matrix room',
    description: 'Verifies if the provided username is a member of the #kreivo:virto.community room'
  })
  @ApiQuery({ 
    name: 'username', 
    required: true, 
    description: 'The Matrix username to check (with or without @ prefix)',
    example: 'alice'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully checked membership',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'alice' },
        isMember: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Username parameter is required' 
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Matrix client is not ready yet' 
  })
  async checkMember(@Query('username') username: string) {
    if (!username) {
      throw new HttpException(
        'Username parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const isMember = await this.matrixService.isMember(username);
      return {
        username,
        isMember,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to check membership',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Check if the Matrix client is connected and ready',
    description: 'Checks if the Matrix client is connected and ready to use'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Matrix client is ready',
    schema: {
      type: 'object',
      properties: {
        ready: { type: 'boolean', example: true },
        status: { type: 'string', example: 'Connected and ready' }
      }
    }
  })
  checkHealth() {
    return this.matrixService.isClientReady();
  }
}

