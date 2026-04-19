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

  it('normalizes a wide image into a portrait canvas without stretching', async () => {
    const wideBuffer = await sharp({
      create: {
        width: 160,
        height: 80,
        channels: 3,
        background: { r: 20, g: 40, b: 60 },
      },
    })
      .png()
      .toBuffer();
    const wideImage = `data:image/png;base64,${wideBuffer.toString('base64')}`;

    const normalized = await service.normalizeToPortraitCanvas(wideImage, {
      targetAspectRatio: 2 / 3,
      maxWidth: 1200,
      maxHeight: 1800,
    });
    const metadata = await service.extractImageMetadata(normalized);

    expect(metadata.height).toBeGreaterThan(metadata.width);
    expect(metadata.width / metadata.height).toBeCloseTo(2 / 3, 1);
  });

  it('can normalize onto a single solid canvas without duplicating the source image in the background', async () => {
    const wideBuffer = await sharp({
      create: {
        width: 160,
        height: 80,
        channels: 3,
        background: { r: 20, g: 40, b: 60 },
      },
    })
      .png()
      .toBuffer();
    const wideImage = `data:image/png;base64,${wideBuffer.toString('base64')}`;

    const normalized = await service.normalizeToPortraitCanvas(wideImage, {
      targetAspectRatio: 2 / 3,
      maxWidth: 1200,
      maxHeight: 1800,
      backgroundStyle: 'solid',
      backgroundColor: { r: 255, g: 255, b: 255, alpha: 1 },
    });

    const normalizedBuffer = Buffer.from(
      normalized.replace(/^data:[^;]+;base64,/, ''),
      'base64',
    );
    const { data, info } = await sharp(normalizedBuffer)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(info.width / info.height).toBeCloseTo(2 / 3, 1);
    expect(Array.from(data.slice(0, 3))).toEqual([255, 255, 255]);
  });
});
