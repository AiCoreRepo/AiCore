import { generateAnglePrompt } from './angle-generation.prompts';
import { AngleType } from '../enums/angle.enum';

describe('generateAnglePrompt', () => {
  it('treats the original virtual try-on image as the only identity reference', () => {
    const prompt = generateAnglePrompt(AngleType.SIDE_LEFT);

    expect(prompt).toContain(
      'The provided image is the ORIGINAL virtual try-on result and the ONLY reference image for this request.',
    );
    expect(prompt).toContain(
      'Use this exact input image directly as the source of truth for face identity, hair, body proportions, outfit continuity, and fit.',
    );
    expect(prompt).toContain(
      'The original virtual try-on image remains the only identity reference throughout generation.',
    );
  });

  it('forbids cropped framing and includes source dimensions when cached metadata exists', () => {
    const prompt = generateAnglePrompt(AngleType.BACK, {
      width: 1024,
      height: 1536,
    });

    expect(prompt).toContain('Do NOT crop, zoom, trim, or reframe the input reference.');
    expect(prompt).toContain('Original reference dimensions: 1024x1536.');
    expect(prompt).toContain('Keep the person fully visible from head to toe.');
  });
});
