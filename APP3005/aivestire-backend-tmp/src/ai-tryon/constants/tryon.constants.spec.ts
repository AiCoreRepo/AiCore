import {
  buildGeminiTryOnPrompt,
  GEMINI_CLOTHING_MODEL_MASK,
} from './tryon.constants';

describe('buildGeminiTryOnPrompt', () => {
  it('builds the same structured prompt style used by Gemini avatar generation', () => {
    const prompt = JSON.parse(
      buildGeminiTryOnPrompt({
        height_cm: 175,
        weight_kg: 68,
        skin_tone: 'medium',
        gender: 'female',
        body_shape: 'athletic',
        body_size: 'medium',
        age_range: '25_35',
        hair_style: 'long_wavy',
      }),
    );

    expect(prompt.role).toBe('virtual try-on assistant');
    expect(prompt.inputs).toEqual({
      image_1: 'avatar person who must remain the same person in the final output',
      image_2: 'garment image that must be worn by image_1 in the final output',
    });
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

  it('forces the same person identity and requires the garment to be actually worn', () => {
    const prompt = JSON.parse(buildGeminiTryOnPrompt());

    expect(prompt.instructions.identity).toContain(
      'Image 1 is the avatar person',
    );
    expect(prompt.instructions.identity).toContain(
      'The final result must clearly be the same person from Image 1',
    );
    expect(prompt.instructions.clothing).toContain(
      'Image 2 is the garment image',
    );
    expect(prompt.instructions.clothing).toContain(
      'make the person in Image 1 actually wear it',
    );
    expect(prompt.instructions.clothing).toContain(
      'not floating, not pasted on, and not shown as a separate reference',
    );
    expect(prompt.constraints).toContain(
      'Do NOT confuse the role of Image 1 and Image 2',
    );
    expect(prompt.constraints).toContain(
      'Do NOT make Image 2 the person identity',
    );
    expect(prompt.constraints).toContain(
      'Image 1 must be the wearer and Image 2 must be the worn garment source',
    );
    expect(prompt.constraints).toContain(
      'Do NOT change the person into someone else or blend the identity with Image 2',
    );
    expect(prompt.constraints).toContain(
      'Do NOT leave the clothing as a separate product shot, overlay, collage, or unworn reference',
    );
  });

  it('allows shoes and accessories from the garment image in the final try-on', () => {
    const prompt = JSON.parse(buildGeminiTryOnPrompt());

    expect(prompt.instructions.clothing).toContain(
      'Shoes, ornaments, jewelry, accessories, embellishments, layering, and extra styling details visible in Image 2 are allowed',
    );
    expect(prompt.constraints).toContain(
      'Shoes, ornaments, jewelry, accessories, and extra styling details visible in Image 2 are allowed in the final try-on',
    );
    expect(prompt.constraints).toContain(
      'Do NOT carry over shoes, ornaments, jewelry, bags, or accessories from Image 1 unless they are also visible in Image 2',
    );
  });

  it('disables clothing-model masking by default to preserve garment details', () => {
    expect(GEMINI_CLOTHING_MODEL_MASK.ENABLED_BY_DEFAULT).toBe(false);
  });
});
