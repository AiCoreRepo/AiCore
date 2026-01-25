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

    // SIMPLE PROMPT - FACE-FIRST approach since model preserves clothes well
    // Background: If input has plain/white bg, generate nice fashion studio background
    // If input already has styled bg, preserve it
    const prompt = `FULL BODY FASHION PHOTOGRAPHY.
    
This photo shows a specific person. Generate a ${angleInstruction} of THIS EXACT PERSON.

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

BACKGROUND INSTRUCTIONS (CRITICAL consistency):
- GENERATE A PLAIN, ATTRACTIVE STUDIO BACKGROUND.
- Style: High-end fashion photography studio, soft gradient lighting.
- Color: Neutral, soft off-white or very light cream/grey (to match premium aesthetic).
- CONSISTENCY: This background must be used for ALL angles. Do not change lighting or color.
- Do NOT generate complex scenes, streets, or busy patterns. Keep it CLEAN and PLAIN.

CAMERA: Rotate strictly to ${angleInstruction}. Person identity and clothes stay EXACTLY the same.`;

    return prompt;
}

/**
 * Generate prompt for try-on session reset
 * Used when starting a new try-on to ensure fresh angle generation
 */
export function generateResetPrompt(): string {
    return 'Session reset. Ready for new angle generation sequence.';
}
