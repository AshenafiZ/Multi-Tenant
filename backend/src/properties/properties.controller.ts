import { 
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe, 
  UploadedFiles, UseInterceptors 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create property with optional images (max 10)' })
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser() user: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.propertiesService.create(createPropertyDto, user.userId, files);
  }

  @Get()
  @ApiPaginated(PropertyResponse)
  @ApiOperation({ summary: 'List properties with advanced filters + pagination' })
  findAll(@Query() filter: FilterPropertiesDto) {
    return this.propertiesService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property details with owner + images + counts' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update own property (Owner/Admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Soft delete own property' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.propertiesService.softDelete(id, user.userId);
  }
}
