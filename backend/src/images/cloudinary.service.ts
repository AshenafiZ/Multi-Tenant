import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error('❌ Cloudinary credentials missing');
      throw new BadRequestException('Cloudinary not configured');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    this.logger.log('✅ Cloudinary configured');
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'properties') {
    if (!file?.buffer || file.size === 0) {
      throw new BadRequestException('Invalid or empty file');
    }

    return new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Upload failed ${file.originalname}:`, error.message);
            return reject(new BadRequestException(error.message));
          }
          if (!result) {
            return reject(new BadRequestException('Upload failed - no result'));
          }
          this.logger.log(`✅ Uploaded: ${result.public_id}`);
          resolve(result);
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string) {
    if (!publicId) {
      throw new BadRequestException('Public ID required');
    }
    const result = await cloudinary.uploader.destroy(publicId);
    this.logger.log(`🗑️ Deleted: ${publicId}`);
    return result;
  }
}
