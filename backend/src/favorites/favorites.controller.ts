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
  @ApiOperation({ summary: 'Add property to favorites' })
  @ApiResponse({ status: 201, description: 'Added to favorites', type: FavoriteResponse })
  create(@Body() dto: ToggleFavoriteDto, @CurrentUser() user: any) {
    return this.favoritesService.toggleFavorite(dto.propertyId, user.userId, 'add');
  }

  @Delete(':propertyId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove property from favorites' })
  @ApiResponse({ status: 200, description: 'Removed from favorites' })
  remove(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @CurrentUser() user: any,
  ) {
    return this.favoritesService.toggleFavorite(propertyId, user.userId, 'remove');
  }

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'User favorites list' })
  findAll(@CurrentUser() user: any) {
    return this.favoritesService.findUserFavorites(user.userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get favorites count' })
  @ApiResponse({ status: 200, description: 'Total favorites count' })
  getCount(@CurrentUser() user: any) {
    return this.favoritesService.getFavoritesCount(user.userId);
  }
}
