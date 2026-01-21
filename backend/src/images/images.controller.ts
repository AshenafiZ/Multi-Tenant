import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { UploadImagesDto } from './dto/upload-images.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiConsumes, ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('images')
@ApiBearerAuth()
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
  @Roles('owner', 'admin')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload images for property (max 10)' })
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto: UploadImagesDto,
    @CurrentUser() user: any,
  ) {
    return this.imagesService.uploadImages(files, uploadDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Delete property image' })
  deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.imagesService.deleteImage(id, user.userId);
  }
}
