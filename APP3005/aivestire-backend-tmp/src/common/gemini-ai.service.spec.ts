import { ConfigService } from '@nestjs/config';
import { GeminiAIService } from './gemini-ai.service';

describe('GeminiAIService prompt building', () => {
  it('locks the avatar pose to joined straight legs and straight arms', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const service = new GeminiAIService(configService);

    const prompt = (service as any).buildAvatarPrompt({
      height: 170,
      weight: 60,
      skinTone: 'medium',
      gender: 'female',
      bodyShape: 'hourglass',
      ageRange: '25_35',
      hairStyle: 'long',
    });

    expect(prompt).toContain('Both legs are straight, vertical, and fully joined together from upper thigh to feet');
    expect(prompt).toContain('There must be zero visible gap anywhere between the legs from hip to toe');
    expect(prompt).toContain('Both arms hang straight down vertically at the sides of the body');
    expect(prompt).toContain('If the source image pose conflicts with these requirements');
    expect(prompt).toContain('bent elbows');
    expect(prompt).toContain('The full body is visible from head to toe');
  });
});
