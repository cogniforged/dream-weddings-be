import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'dream-weddings',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 10MB.',
      );
    }

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: folder,
              resource_type: 'image',
              transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
            },
            (
              error: UploadApiErrorResponse | undefined,
              result: UploadApiResponse | undefined,
            ) => {
              if (error) {
                reject(error);
              } else if (result) {
                resolve(result);
              }
            },
          )
          .end(file.buffer);
      });

      return result.secure_url;
    } catch (error) {
      throw new BadRequestException('Failed to upload image');
    }
  }

  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'dream-weddings',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only MP4 and WebM are allowed.',
      );
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 100MB.',
      );
    }

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: folder,
              resource_type: 'video',
              transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
            },
            (
              error: UploadApiErrorResponse | undefined,
              result: UploadApiResponse | undefined,
            ) => {
              if (error) {
                reject(error);
              } else if (result) {
                resolve(result);
              }
            },
          )
          .end(file.buffer);
      });

      return result.secure_url;
    } catch (error) {
      throw new BadRequestException('Failed to upload video');
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'dream-weddings',
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new BadRequestException('Failed to delete image');
    }
  }

  async deleteVideo(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (error) {
      throw new BadRequestException('Failed to delete video');
    }
  }

  async generateThumbnail(videoUrl: string): Promise<string> {
    try {
      const publicId = this.extractPublicId(videoUrl);
      const thumbnailUrl = cloudinary.url(publicId, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 300, height: 200, crop: 'fill' },
          { quality: 'auto' },
        ],
      });
      return thumbnailUrl;
    } catch (error) {
      throw new BadRequestException('Failed to generate thumbnail');
    }
  }

  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }

  async optimizeImage(
    url: string,
    width?: number,
    height?: number,
    quality: string = 'auto',
  ): Promise<string> {
    try {
      const publicId = this.extractPublicId(url);
      const optimizedUrl = cloudinary.url(publicId, {
        transformation: [
          ...(width && height ? [{ width, height, crop: 'fill' }] : []),
          { quality },
          { fetch_format: 'auto' },
        ],
      });
      return optimizedUrl;
    } catch (error) {
      throw new BadRequestException('Failed to optimize image');
    }
  }
}
