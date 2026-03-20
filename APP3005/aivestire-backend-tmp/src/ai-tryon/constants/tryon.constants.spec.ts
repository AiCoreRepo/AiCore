import {
  buildGeminiTryOnPrompt,
  GEMINI_CLOTHING_MODEL_MASK,
} from './tryon.constants';

describe('buildGeminiTryOnPrompt', () => {
  it('builds a direct Gemini image-edit prompt with dynamic aura attributes', () => {
    const prompt = buildGeminiTryOnPrompt({
      height_cm: 175,
      weight_kg: 68,
      skin_tone: 'medium',
      gender: 'female',
      body_shape: 'athletic',
      body_size: 'medium',
      age_range: '25_35',
      hair_style: 'long_wavy',
    });

    expect(prompt).toContain(
      'Create exactly one new photorealistic virtual try-on image.',
    );
    expect(prompt).toContain(
      'The first image is the garment or outfit reference.',
    );
    expect(prompt).toContain(
      'The second image is the real person/avatar whose identity must remain unchanged in the final result.',
    );
    expect(prompt).toContain(`- Height: 175 cm (5'9")`);
    expect(prompt).toContain('- Body shape: athletic');
    expect(prompt).toContain('- Body size: medium');
    expect(prompt).toContain('- Weight: 68 kg');
    expect(prompt).toContain('- Skin tone: medium');
    expect(prompt).toContain('- Gender: female');
    expect(prompt).toContain('- Approximate age: 25');
    expect(prompt).toContain('- Hair style: long wavy');
  });

  it('forces the same person identity and requires the garment to be actually worn', () => {
    const prompt = buildGeminiTryOnPrompt();

    expect(prompt).toContain(
      'Take the garment from the first image and make the person from the second image actually wear it.',
    );
    expect(prompt).toContain(
      'Preserve the exact same face, skin tone, hairline, hairstyle, hair length, hair volume, hair texture, and body proportions of the second image.',
    );
    expect(prompt).toContain(
      'Do not replace, beautify, reshape, or blend the second-image face or body with the clothing-model or mannequin identity from the first image.',
    );
    expect(prompt).toContain(
      'Maintain natural human anatomy and realistic proportions, including a correct head-to-body ratio, centered neck placement, aligned shoulders, and proportional torso, arms, hands, legs, and feet.',
    );
    expect(prompt).toContain(
      'The clothing must look naturally worn by the second-image person, not pasted on, floating, overlaid, or shown as a separate product shot.',
    );
    expect(prompt).toContain(
      'The final image must clearly show that the second-image person is wearing the first-image garment.',
    );
    expect(prompt).toContain(
      'Do not return the second image with only tiny edits while leaving the original outfit in place.',
    );
    expect(prompt).toContain(
      'Do not stretch, squeeze, elongate, shrink, warp, or tilt the face, head, neck, shoulders, torso, arms, hands, hips, legs, or feet.',
    );
    expect(prompt).toContain(
      'Do not generate an oversized face, undersized face, floating face, mismatched face-to-body scale, merged limbs, duplicated limbs, or broken anatomy.',
    );
  });

  it('allows shoes and accessories from the garment image in the final try-on', () => {
    const prompt = buildGeminiTryOnPrompt();

    expect(prompt).toContain(
      'Keep garment colors, prints, textures, trims, embroidery, silhouette, neckline, sleeves, layering, shoes, jewelry, and accessories that are visible in the first image.',
    );
  });

  it('disables clothing-model masking by default to preserve garment details', () => {
    expect(GEMINI_CLOTHING_MODEL_MASK.ENABLED_BY_DEFAULT).toBe(false);
  });
});
