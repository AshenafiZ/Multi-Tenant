import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaginatedUsersResponse, UserResponse } from './entities/paginated-users.entity';
import { ApiPaginatedResponse } from '../common/entities/paginated-response.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ ADMIN: List ALL users (works with empty query)
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users with admin dashboard filters' })
  @ApiPaginatedResponse(UserResponse)
  @ApiResponse({ type: PaginatedUsersResponse })
  findAll(@Query() query: QueryUsersDto, @CurrentUser() user: any) {
    return this.usersService.findAll(query, user.role === 'admin');
  }

  // ✅ ANY AUTH USER: Get own profile (works with empty query)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with filters' })
  @ApiPaginatedResponse(UserResponse)
  getProfile(@Query() query: QueryUsersDto, @CurrentUser() user: any) {
    return this.usersService.findAll({ ...query, me: true }, false, user.userId);
  }

  // ✅ ADMIN: Get single user (including soft deleted)
  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user by ID (admin sees soft deleted)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id, true);
  }

  // ✅ ADMIN: Update any user
  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user by ID' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  // ✅ ADMIN: Soft delete user
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Soft delete user' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.softDelete(id);
  }
}
