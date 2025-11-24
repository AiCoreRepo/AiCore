import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is missing in .env file');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  async uploadImage(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(file, (error, result) => {
        if (error || !result) {
          reject(new Error('Failed to upload image to Cloudinary'));
        } else {
          resolve(result.secure_url);
        }
      });
    });
  }
}
