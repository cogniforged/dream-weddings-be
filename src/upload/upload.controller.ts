import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../schemas/user.schema';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
    @CurrentUser() user: UserDocument,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const url = await this.uploadService.uploadImage(file, folder);
    return { url };
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder: string,
    @CurrentUser() user: UserDocument,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const urls = await this.uploadService.uploadMultipleImages(files, folder);
    return { urls };
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
    @CurrentUser() user: UserDocument,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const url = await this.uploadService.uploadVideo(file, folder);
    return { url };
  }

  @Post('optimize')
  async optimizeImage(
    @Body('url') url: string,
    @CurrentUser() user: UserDocument,
    @Body('width') width?: number,
    @Body('height') height?: number,
    @Body('quality') quality?: string,
  ) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    const optimizedUrl = await this.uploadService.optimizeImage(
      url,
      width,
      height,
      quality,
    );
    return { url: optimizedUrl };
  }

  @Post('thumbnail')
  async generateThumbnail(
    @Body('videoUrl') videoUrl: string,
    @CurrentUser() user: UserDocument,
  ) {
    if (!videoUrl) {
      throw new BadRequestException('Video URL is required');
    }

    const thumbnailUrl = await this.uploadService.generateThumbnail(videoUrl);
    return { url: thumbnailUrl };
  }
}
