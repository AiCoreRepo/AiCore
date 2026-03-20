import { ConfigService } from '@nestjs/config';
import { GeminiAIService } from './gemini-ai.service';

describe('GeminiAIService prompt building', () => {
  const createService = () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    return new GeminiAIService(configService);
  };

  it('builds a structured two-image try-on prompt for avatar generation', () => {
    const service = createService();

    const prompt = JSON.parse(
      (service as any).buildAvatarPrompt({
        height: 175,
        weight: 68,
        skinTone: 'medium',
        gender: 'female',
        bodyShape: 'athletic',
        bodySize: 'medium',
        ageRange: '25_35',
        hairStyle: 'long_wavy',
      }),
    );

    expect(prompt.role).toBe('virtual try-on assistant');
    expect(prompt.inputs).toEqual({
      image_1: 'person',
      image_2: 'clothing',
    });
    expect(prompt.instructions.identity).toContain(
      "Preserve the person's exact face features, skin tone, hairline, hairstyle, hair length, hair volume, hair texture, and body type exactly.",
    );
    expect(prompt.instructions.identity).toContain(
      'expand the canvas and reconstruct the missing framing so the complete head and full hair silhouette are visible naturally',
    );
    expect(prompt.instructions.identity).toContain('height is authoritative');
    expect(prompt.instructions.identity).toContain(
      'Maintain natural human anatomy and realistic proportions throughout',
    );
    expect(prompt.instructions.clothing).toContain(
      'Apply ONLY the full visible outfit from Image 2 faithfully.',
    );
    expect(prompt.instructions.clothing).toContain(
      'Make the person from Image 1 actually wear the Image 2 outfit naturally on their body.',
    );
    expect(prompt.instructions.clothing).toContain(
      'not to the mannequin or model proportions seen in Image 2',
    );
    expect(prompt.instructions.output).toContain('Full body (head to toe)');
    expect(prompt.instructions.output).toContain(
      'full head visible with all hair fully in frame',
    );
    expect(prompt.instructions.output).toContain(
      'generous headroom above the hair',
    );
    expect(prompt.instructions.output).toContain(
      'visible side margin around the hair silhouette',
    );
    expect(prompt.instructions.output).toContain('happy closed-mouth smile');
    expect(prompt.instructions.output).toContain('no visible teeth');
    expect(prompt.instructions.output).toContain(
      'the person from Image 1 is wearing the full outfit from Image 2',
    );
    expect(prompt.instructions.output).toContain(
      'proportionally balanced full-body portrait',
    );
  });

  it('maps aura attributes into person_attributes for full-body reconstruction', () => {
    const service = createService();

    const prompt = JSON.parse(
      (service as any).buildAvatarPrompt({
        height: 175,
        weight: 68,
        skinTone: 'medium',
        gender: 'female',
        bodyShape: 'athletic',
        bodySize: 'medium',
        ageRange: '25_35',
        hairStyle: 'long_wavy',
      }),
    );

    expect(prompt.person_attributes).toEqual({
      height: `5'9"`,
      height_cm: 175,
      body_shape: 'athletic',
      skin_tone: 'medium',
      age: 25,
      gender: 'female',
      body_size: 'medium',
      weight_kg: 68,
      hair_style: 'long wavy',
    });
  });

  it('keeps the new accessory and carry-over constraints intact', () => {
    const service = createService();

    const prompt = JSON.parse(
      (service as any).buildAvatarPrompt({
        height: 165,
        weight: 55,
        skinTone: 'light_medium',
        gender: 'female',
        bodyShape: 'hourglass',
        bodySize: 'small',
        ageRange: '18_24',
        hairStyle: 'straight',
      }),
    );

    expect(prompt.constraints).toContain('Do NOT crop the output');
    expect(prompt.constraints).toContain(
      'Return exactly one newly generated avatar image',
    );
    expect(prompt.constraints).toContain('Do NOT return Image 1 unchanged');
    expect(prompt.constraints).toContain('Do NOT return Image 2 unchanged');
    expect(prompt.constraints).toContain(
      'Do NOT leave the original outfit from Image 1 in place with only tiny edits',
    );
    expect(prompt.constraints).toContain(
      'Do NOT create a collage, side-by-side panel, before/after layout, product board, or multiple people',
    );
    expect(prompt.constraints).toContain(
      'Do NOT crop, trim, cut off, or hide any part of the hair, head, or forehead',
    );
    expect(prompt.constraints).toContain(
      'Do NOT let the hair, head, or forehead touch the top or side edges of the image',
    );
    expect(prompt.constraints).toContain(
      'Do NOT zoom in so tightly that the full hair silhouette is not visible',
    );
    expect(prompt.constraints).toContain(
      'Do NOT change face shape, eye shape, nose, lips, jawline, or hairline',
    );
    expect(prompt.constraints).toContain(
      'Do NOT stretch, squeeze, elongate, shrink, warp, or tilt the face, head, neck, shoulders, torso, arms, hands, hips, legs, or feet',
    );
    expect(prompt.constraints).toContain(
      'Do NOT generate an oversized face, undersized face, floating face, or mismatched face-to-body scale',
    );
    expect(prompt.constraints).toContain(
      'Do NOT generate unnatural anatomy, broken limb proportions, merged limbs, duplicated limbs, or misaligned shoulders',
    );
    expect(prompt.constraints).toContain(
      'Do NOT shorten, restyle, flatten, tie back, or simplify the hair',
    );
    expect(prompt.constraints).toContain(
      'Do NOT use the mannequin or clothing-model height, leg length, or body proportions from Image 2',
    );
    expect(prompt.constraints).toContain(
      'Do NOT let Image 2 override the height specified in person_attributes',
    );
    expect(prompt.constraints).toContain('Do NOT show teeth in the smile');
    expect(prompt.constraints).toContain(
      'Do NOT carry over any ornaments, jewelry, rings, necklaces, earrings, or accessories from Image 1',
    );
    expect(prompt.constraints).toContain(
      'Do NOT carry over any bags, purses, handbags, or carried items from Image 1',
    );
    expect(prompt.constraints).toContain(
      'Do NOT carry over any hats, caps, sunglasses, or headwear from Image 1',
    );
    expect(prompt.constraints).toContain(
      'ONLY the full visible outfit from Image 2 should appear on the final avatar',
    );
  });
});
