import { 
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe, 
  UploadedFiles, UseInterceptors 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { 
  CreatePropertyDto 
} from './dto/create-property.dto';
import { 
  UpdatePropertyDto 
} from './dto/update-property.dto';
import { 
  FilterPropertiesDto 
} from './dto/filter-properties.dto';
import { ApiPaginated } from '../common/decorators/api-paginated.decorator';
import { PropertyResponse } from './entities/property-response.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiResponse, ApiBody } from '@nestjs/swagger';
import { imageMulterOptions } from '../common/pipes/image-upload-options';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @UseInterceptors(FilesInterceptor('images', 10, imageMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create new property (draft)',
    description: 'Create a new property in draft status. You can upload up to 10 images (JPEG/PNG/WEBP, 5MB each). Properties start as drafts and must be published to be visible to users.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Property created successfully',
    type: PropertyResponse 
  })
  @ApiResponse({ status: 400, description: 'Validation error or invalid image format/size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only owners and admins can create properties' })
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser() user: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.propertiesService.create(createPropertyDto, user, files);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiPaginated(PropertyResponse)
  @ApiOperation({ 
    summary: 'List properties (role-based)',
    description: 'Get paginated list of properties. Public users see only published properties. Owners see published + their own drafts. Admins see all properties including deleted.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated list of properties',
    type: [PropertyResponse] 
  })
  findAll(@Query() filter: FilterPropertiesDto, @CurrentUser() user: any) {
    try {
      return this.propertiesService.findAllByRole(filter, user ?? null);
    } catch (error) {
      console.error('Error in properties findAll:', error);
      throw error;
    }
  }

  @Get('my-properties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @ApiBearerAuth()
  @ApiPaginated(PropertyResponse)
  @ApiOperation({ 
    summary: 'Get owner\'s own properties',
    description: 'Get paginated list of properties owned by the current user. Shows both draft and published properties.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated list of owner properties',
    type: [PropertyResponse] 
  })
  findMyProperties(@Query() filter: FilterPropertiesDto, @CurrentUser() user: any) {
    return this.propertiesService.findOwnerProperties(user.userId, filter);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get property details',
    description: 'Get detailed information about a property. Published properties are visible to everyone. Draft/archived properties are only visible to the owner or admin.'
  })
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ 
    status: 200, 
    description: 'Property details',
    type: PropertyResponse 
  })
  @ApiResponse({ status: 404, description: 'Property not found or not accessible' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.propertiesService.findOnePublicOrPrivate(id, user ?? null);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
  @Roles('owner', 'admin')
  @UseInterceptors(FilesInterceptor('images', 10, imageMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update property',
    description: 'Update a property. Owners can update their own draft and published properties. Admins can update any property. Supports image upload.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Property updated successfully',
    type: PropertyResponse 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the property owner' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.propertiesService.updateDraft(id, updatePropertyDto, user, files);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
  @Roles('owner', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Publish draft property',
    description: 'Publish a draft property. This action is transactional and validates that the property has all required fields (title, description, location, price, and at least 1 image). Once published, the property becomes immutable and visible to all users.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Property published successfully',
    type: PropertyResponse 
  })
  @ApiResponse({ status: 400, description: 'Property validation failed - missing required fields or images' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the property owner' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.propertiesService.publish(id, user);
  }

  @Post(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Admin: Disable (archive) property',
    description: 'Admin-only endpoint to disable/archive any property. This sets the property status to archived, making it invisible to regular users.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Property disabled successfully',
    type: PropertyResponse 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  disable(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.propertiesService.disable(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
  @Roles('owner', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Soft delete property',
    description: 'Soft delete your own property. This marks the property as deleted but does not permanently remove it from the database.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Property soft deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Property soft deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the property owner' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.propertiesService.softDelete(id, user);
  }
}
