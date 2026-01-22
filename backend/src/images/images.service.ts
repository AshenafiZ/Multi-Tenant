import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { UploadImagesDto } from './dto/upload-images.dto';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async uploadImagesForProperty(propertyId: string, files: Express.Multer.File[]) {
    if (!files?.length) return [];
    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed');
    }

    const uploadedImages: any[] = [];
    for (const file of files) {
      const result = await this.cloudinary.uploadImage(file, 'properties');
      const image = await this.prisma.image.create({
        data: {
          url: result.secure_url,
          propertyId,
          publicId: result.public_id,
        },
      });
      uploadedImages.push(image);
    }
    return uploadedImages;
  }

  async uploadImages(files: Express.Multer.File[], dto: UploadImagesDto, userId: string) {
    this.logger.log(`Upload request: ${files.length} files for property ${dto.propertyId}`);

    // ✅ Ownership check FIRST
    const property = await this.prisma.property.findFirst({
      where: {
        id: dto.propertyId,
        ownerId: userId,
        deletedAt: null,
      },
    });

    if (!property) {
      throw new ForbiddenException('Property not found or access denied');
    }

    if (files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed');
    }

    const uploadedImages: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.cloudinary.uploadImage(file, 'properties');
        
        const image = await this.prisma.image.create({
          data: {
            url: result.secure_url,
            propertyId: dto.propertyId,
            publicId: result.public_id,
          },
        });

        uploadedImages.push(image);
        this.logger.log(`✅ Image ${i + 1}/${files.length}: ${result.public_id}`);
      } catch (error) {
        this.logger.error(`❌ File ${file.originalname}:`, error.message);
        throw new BadRequestException(`Failed to upload ${file.originalname}: ${error.message}`);
      }
    }

    return {
      message: `${uploadedImages.length} images uploaded successfully`,
      images: uploadedImages,
    };
  }

  async deleteImage(imageId: string, userId: string) {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        publicId: true,
        property: {
          select: {
            ownerId: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    if (!image.publicId) {
      throw new BadRequestException('No publicId for deletion');
    }

    if (image.property.deletedAt || image.property.ownerId !== userId) {
      throw new ForbiddenException('Not authorized to delete this image');
    }

    await this.cloudinary.deleteImage(image.publicId);
    await this.prisma.image.update({
      where: { id: imageId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Image deleted successfully' };
  }
}
