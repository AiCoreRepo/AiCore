import { AngleType, ANGLE_DEFINITIONS } from '../enums/angle.enum';

/**
 * Generate optimized prompt for angle generation
 * Uses a SIMPLE, DIRECT approach - less is more with generative AI
 *
 * @param angle - The target angle to generate
 * @param cachedMetadata - Optional cached image metadata for optimization
 * @returns Optimized prompt for Gemini AI
 */
export function generateAnglePrompt(
  angle: AngleType,
  cachedMetadata?: Record<string, any>,
): string {
  const angleInstruction = ANGLE_DEFINITIONS[angle];
  const sourceDimensions =
    cachedMetadata?.width && cachedMetadata?.height
      ? ` Original reference dimensions: ${cachedMetadata.width}x${cachedMetadata.height}.`
      : '';

  const prompt = `FULL BODY FASHION PHOTOGRAPHY.

REFERENCE RULES (CRITICAL):
- The provided image is the ORIGINAL virtual try-on result and the ONLY reference image for this request.
- This single input already contains the correct face and the correct outfit together.
- Use this exact input image directly as the source of truth for face identity, hair, body proportions, outfit continuity, and fit.
- Maintain the EXACT same person identity from this input image in the final output.
- Do NOT replace the face with a new face, beautified face, mannequin face, model face, or blended face.
- Do NOT reinterpret the outfit from a mannequin, catalog image, or separate clothing reference.
- Do NOT crop, zoom, trim, or reframe the input reference. Keep the final output full-body and uncropped.${sourceDimensions}

Generate a ${angleInstruction} of THIS EXACT PERSON.

FACE REQUIREMENTS (CRITICAL):
- Copy the EXACT face from the input image (for side/angle views, ensure the profile matches perfectly)
- Same facial structure, same eyes, same nose, same lips, same jawline
- Same skin color and complexion - do not lighten or darken
- Same eyebrows, same forehead shape
- If there are any facial marks or features, keep them

PRESERVE EXACTLY:
- Same hair color and style (visualize how it looks from ${angleInstruction})
- Same clothes with exact colors and patterns.
- Full body visible, no zoom. Shoes must be visible.
- Keep the same garment fit, drape, styling, and proportions already present in the original try-on image.
- Maintain natural human anatomy and realistic proportions, including a correct head-to-body ratio, centered neck placement, aligned shoulders, and proportional torso, arms, hands, legs, and feet.

FRAMING REQUIREMENTS (CRITICAL):
- Use the original full-body try-on composition as the baseline framing.
- Do NOT crop the head, hair, face, shoulders, hands, feet, or shoes.
- Do NOT zoom in or create a half-body or three-quarter crop.
- Keep the person fully visible from head to toe.
- Do NOT stretch, squeeze, elongate, shrink, warp, or tilt the face, head, neck, shoulders, torso, arms, hands, hips, legs, or feet.
- Do NOT generate an oversized face, undersized face, floating face, mismatched face-to-body scale, merged limbs, duplicated limbs, or broken anatomy.

BACKGROUND INSTRUCTIONS (CRITICAL consistency):
- GENERATE A PLAIN, ATTRACTIVE STUDIO BACKGROUND.
- Style: High-end fashion photography studio, soft gradient lighting.
- Color: Neutral, soft off-white or very light cream/grey (to match premium aesthetic).
- CONSISTENCY: This background must be used for ALL angles. Do not change lighting or color.
- Do NOT generate complex scenes, streets, or busy patterns. Keep it CLEAN and PLAIN.

CAMERA: Rotate strictly to ${angleInstruction}. Person identity and clothes stay EXACTLY the same. The original virtual try-on image remains the only identity reference throughout generation.`;

  return prompt;
}

/**
 * Generate prompt for try-on session reset
 * Used when starting a new try-on to ensure fresh angle generation
 */
export function generateResetPrompt(): string {
  return 'Session reset. Ready for new angle generation sequence.';
}
