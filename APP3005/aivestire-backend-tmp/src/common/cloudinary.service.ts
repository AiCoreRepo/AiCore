import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

// Cloudinary upload configuration constants
const CLOUDINARY_UPLOAD_OPTIONS = {
  timeout: 120000, // 120 seconds timeout
  chunk_size: 6000000, // 6MB chunks for large files
  resource_type: 'auto' as const, // Auto-detect resource type
};

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
      console.log('Starting Cloudinary upload...');
      console.log('Image data length:', file.length);
      console.log('Image data preview:', file.substring(0, 100));

      cloudinary.uploader.upload(
        file,
        CLOUDINARY_UPLOAD_OPTIONS,
        (error, result) => {
          if (error || !result) {
            console.error('❌ Cloudinary upload failed!');
            console.error('Error details:', JSON.stringify(error, null, 2));
            console.error('Error message:', error?.message);
            console.error('Error http_code:', error?.http_code);
            reject(new Error(`Failed to upload image to Cloudinary: ${error?.message || 'Unknown error'}`));
          } else {
            console.log('✅ Cloudinary upload success:', result.secure_url);
            resolve(result.secure_url);
          }
        },
      );
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
      const urlParts = imageUrl.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      const publicId = fileNameWithExt.split('.')[0];

      console.log('Deleting image with public_id:', publicId);

      await cloudinary.uploader.destroy(publicId);
      console.log('Image deleted successfully from Cloudinary');
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }
}
