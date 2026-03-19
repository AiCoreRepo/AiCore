import sharp from 'sharp';
import { ImageOptimizerService } from './image-optimizer.service';

describe('ImageOptimizerService visual similarity', () => {
  let service: ImageOptimizerService;

  beforeEach(() => {
    service = new ImageOptimizerService();
  });

  const createSolidImage = async (rgb: {
    r: number;
    g: number;
    b: number;
  }): Promise<string> => {
    const buffer = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: rgb,
      },
    })
      .png()
      .toBuffer();

    return `data:image/png;base64,${buffer.toString('base64')}`;
  };

  it('marks identical images as visually similar', async () => {
    const image = await createSolidImage({ r: 10, g: 20, b: 30 });

    await expect(service.areImagesVisuallySimilar(image, image)).resolves.toBe(
      true,
    );
  });

  it('does not mark clearly different images as visually similar', async () => {
    const first = await createSolidImage({ r: 255, g: 0, b: 0 });
    const second = await createSolidImage({ r: 0, g: 0, b: 255 });

    await expect(
      service.areImagesVisuallySimilar(first, second),
    ).resolves.toBe(false);
  });
});
