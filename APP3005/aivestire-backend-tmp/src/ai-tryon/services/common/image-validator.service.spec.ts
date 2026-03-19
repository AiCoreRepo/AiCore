import { ImageValidatorService } from './image-validator.service';

describe('ImageValidatorService', () => {
  let service: ImageValidatorService;

  beforeEach(() => {
    service = new ImageValidatorService();
  });

  it('accepts signed image URLs without a file extension', async () => {
    await expect(
      service.validateImage(
        'https://example.com/media/avatar?token=secure-signed-value',
      ),
    ).resolves.toMatchObject({
      valid: true,
      mimeType: 'image/jpeg',
    });
  });

  it('extracts the mime type from the pathname when the URL includes query params', async () => {
    await expect(
      service.validateImage(
        'https://cdn.example.com/uploads/lookbook/outfit.webp?Expires=123&Signature=abc',
      ),
    ).resolves.toMatchObject({
      valid: true,
      mimeType: 'image/webp',
    });
  });
});
