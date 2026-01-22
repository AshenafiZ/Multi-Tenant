import { 
  Controller, 
  Post, 
  Delete, 
  Body, 
  Param, 
  ParseUUIDPipe, 
  UseGuards, 
  Get,
  Query,
  HttpCode 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { FavoriteResponse } from './entities/favorite.entity';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ 
    summary: 'Add property to favorites',
    description: 'Add a published property to your favorites list. You can only favorite published properties.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Property added to favorites successfully',
    type: FavoriteResponse 
  })
  @ApiResponse({ status: 400, description: 'Property already in favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  create(@Body() dto: ToggleFavoriteDto, @CurrentUser() user: any) {
    return this.favoritesService.toggleFavorite(dto.propertyId, user.userId, 'add');
  }

  @Delete(':propertyId')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Remove property from favorites',
    description: 'Remove a property from your favorites list'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Property removed from favorites successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Removed from favorites' },
        count: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  remove(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @CurrentUser() user: any,
  ) {
    return this.favoritesService.toggleFavorite(propertyId, user.userId, 'remove');
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get user favorites',
    description: 'Get all properties in your favorites list with property details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of favorite properties',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          property: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' },
              price: { type: 'number' },
              status: { type: 'string', enum: ['draft', 'published', 'archived'] },
              images: { type: 'array', items: { type: 'string' } },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: any) {
    return this.favoritesService.findUserFavorites(user.userId);
  }

  @Get('count')
  @ApiOperation({ 
    summary: 'Get favorites count',
    description: 'Get the total number of properties in your favorites list'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Total favorites count',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCount(@CurrentUser() user: any) {
    return this.favoritesService.getFavoritesCount(user.userId);
  }
}
