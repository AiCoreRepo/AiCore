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
      bodySize: 'medium',
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

  it('forces modest full-length lower wear when the lower body must be reconstructed', () => {
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
      bodySize: 'medium',
      ageRange: '25_35',
      hairStyle: 'long',
    });

    expect(prompt).toContain('If the lower body is missing, cropped, occluded, or impossible to infer from the source image');
    expect(prompt).toContain('tasteful, modest, full-length lower wear');
    expect(prompt).toContain('Never leave the lower body nude, bare, underwear-only');
    expect(prompt).toContain('mini shorts | hot pants | revealing shorts');
    expect(prompt).toContain('Body size: medium');
    expect(prompt).toContain('the final lower wear is modest, full-length, and suitable for a decent fashion portrait');
  });

  it('requires a happy natural smile in the generated avatar', () => {
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
      bodySize: 'medium',
      ageRange: '25_35',
      hairStyle: 'long',
    });

    expect(prompt).toContain('The final portrait must show a happy, warm, natural smile');
    expect(prompt).toContain('If the source photo has a neutral, serious, blank, or tense expression');
    expect(prompt).toContain('sad expression | angry expression | blank expression | frown');
    expect(prompt).toContain('The final face has a happy, natural, clearly smiling expression');
  });
});
