import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AvatarGenerationRequest {
  imageUrl: string;
  attributes: {
    height: number;
    weight: number;
    skinTone: string;
    gender: string;
    bodyShape: string;
    ageRange: string;
    hairStyle: string;
  };
}

export interface AvatarImageResponse {
  success: boolean;
  imageBase64?: string | null;
  error?: string;
}

@Injectable()
export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private imageModel: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn(' GEMINI_API_KEY not configured');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use Gemini 2.5 Flash Image (Nano Banana) for image generation
      this.imageModel = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-image',
      });
      console.log(
        ' Using Gemini 2.5 Flash Image (Nano Banana) for avatar generation',
      );
    }
  }

  /**
   * Generate professional animated avatar using Gemini AI
   */
  async generateAvatarImage(
    request: AvatarGenerationRequest,
  ): Promise<AvatarImageResponse> {
    if (!this.imageModel) {
      console.log(
        '⚠️ [GeminiAI] Image model not initialized, using original image',
      );
      return { success: true, imageBase64: null };
    }

    try {
      console.log(
        '🎨 Generating professional animated avatar with Gemini 2.5 Flash Image...',
      );

      console.log('📥 [GeminiAI] Fetching source image...');
      const imageBase64 = await this.fetchImageAsBase64(request.imageUrl);
      console.log(
        `✅ [GeminiAI] Source image fetched: ${imageBase64.length} chars`,
      );

      const { attributes } = request;

      // Build dynamic prompt from user attributes
      const {
        height,
        weight,
        skinTone,
        gender,
        bodyShape,
        ageRange,
        hairStyle,
      } = attributes;

      // Helper to clean up internal keys (e.g., 'pear_shape' -> 'pear shape')
      const formatAttr = (val: string) => val.replace(/_/g, ' ');

      // Check which attributes the user actually provided (non-empty, non-default)
      const hasGender = gender && gender !== 'unspecified';
      const hasAgeRange = !!ageRange;
      const hasSkinTone = !!skinTone;
      const hasBodyShape = bodyShape && bodyShape !== 'average';
      const hasHeight = !!height;
      const hasWeight = !!weight;
      const hasHairStyle = !!hairStyle;

      const hasAnyAttribute =
        hasGender ||
        hasAgeRange ||
        hasSkinTone ||
        hasBodyShape ||
        hasHeight ||
        hasWeight ||
        hasHairStyle;

      let prompt: string;
      const posePriorityInstructions = `STRICT POSE REQUIREMENT (HIGHEST PRIORITY):
The avatar MUST stand with:
- BOTH legs fully straight
- BOTH legs touching from thighs to ankles
- NO GAP between legs
- feet together and parallel
- no walking stance
- no staggered stance
- no leg separation

If the source photo shows separated legs, you MUST correct it.

STRICT ARM REQUIREMENT:
- both arms straight down along body
- hands beside thighs
- elbows straight

CRITICAL POSE REQUIREMENT:
The avatar MUST stand upright with BOTH legs touching together.

Leg position must follow ALL rules:
- thighs touching
- knees touching
- calves touching
- ankles touching
- feet touching
- no visible gap anywhere between the legs

The model must NOT generate:
- wide stance
- separated legs
- walking stance
- one leg forward
- bent knees

DO NOT generate:
- walking pose
- wide stance
- legs apart
- one leg forward
- split stance
- bent knees

Keep both arms and both legs fully visible, complete, connected, symmetrical, and anatomically correct.
The final pose should resemble a passport photo full-body stance with legs together.`;
      const referenceUsageInstructions = `REFERENCE PHOTO USAGE:
Use the reference photo ONLY for:
- face
- identity
- hairstyle
- clothing

DO NOT copy the pose from the reference photo.`;
      const fullBodyInstructions =
        'FULL-BODY RULE: if the source photo is cropped, partial, or does not show the entire body, you MUST extend it to a complete full-body avatar in the same strict pose described above. When generating missing body parts, synthesize both arms straight down at the outer sides with hands beside the thighs, and synthesize both legs fully straight and tightly closed together from upper thighs to ankles with no visible gap between them. Do not invent a walking pose, bent-arm pose, wide stance, separated legs, one leg forward, or bent knees while extending to full body.';
      const hairInstructions =
        "Preserve the person's visible hair length, volume, silhouette, and style exactly. Do not shorten, trim, crop, tuck behind the shoulders, tie back, or otherwise reduce the apparent hair length.";
      const finalPoseCheck = `FINAL POSE CHECK:
The avatar MUST have both legs closed together with no visible gap.
If legs appear separated, regenerate the pose so the legs touch.`;

      if (hasAnyAttribute) {
        // ---- ATTRIBUTES PROVIDED: Build a detailed, attribute-driven prompt ----
        // Build specific attribute instructions so Gemini follows them precisely
        const specificInstructions: string[] = [];

        if (hasGender) {
          specificInstructions.push(
            `- Gender: The person is ${formatAttr(gender)}. The avatar MUST clearly represent a ${formatAttr(gender)} person.`,
          );
        }
        if (hasAgeRange) {
          specificInstructions.push(
            `- Age: The person appears to be in the ${ageRange} age range. Reflect this age accurately in the avatar's face and body.`,
          );
        }
        if (hasSkinTone) {
          specificInstructions.push(
            `- Skin Tone: The person has a ${formatAttr(skinTone)} skin tone. The avatar's skin MUST match this ${formatAttr(skinTone)} tone exactly — do NOT lighten or darken it.`,
          );
        }
        if (hasBodyShape) {
          specificInstructions.push(
            `- Body Shape: The person has a ${formatAttr(bodyShape)} body shape. The avatar's body proportions MUST reflect a ${formatAttr(bodyShape)} silhouette.`,
          );
        }
        if (hasHeight) {
          specificInstructions.push(
            `- Height: The person is approximately ${height}cm tall. Reflect appropriate body proportions for this height.`,
          );
        }
        if (hasWeight) {
          specificInstructions.push(
            `- Weight: The person weighs approximately ${weight}kg. The avatar's build should match this weight realistically.`,
          );
        }
        if (hasHairStyle) {
          specificInstructions.push(
            `- Hair: The person has ${formatAttr(hairStyle)} hair. The avatar MUST have ${formatAttr(hairStyle)} hair style while preserving the visible hair length and fullness. Do NOT shorten, trim, tuck back, or reduce the hair.`,
          );
        }

        prompt = `${posePriorityInstructions}

${referenceUsageInstructions}

You are generating a hyper-realistic full-body avatar based on the reference photo AND the following user-specified attributes. The attributes below are PROVIDED BY THE USER and MUST take priority over what you see in the photo.

USER-SPECIFIED ATTRIBUTES (MUST FOLLOW):
${specificInstructions.join('\n')}

INSTRUCTIONS:
1. CRITICALLY IMPORTANT: Apply ALL the user-specified attributes above to the generated avatar. These attributes OVERRIDE what you observe in the photo.
2. Beautify the face subtly while preserving the person's recognizable facial features.
3. Create a full-body avatar. ${fullBodyInstructions} Preserve the outfit and add matching appropriate footwear if the lower body is missing.
4. ${hairInstructions}
5. Keep the existing clothing unchanged but ensure it looks clean and well-fitted.
6. Set the background to a clean, premium studio look with soft, natural lighting.
7. Maintain photorealism with sharp details throughout.
8. The final image must look like a professional fashion model photo.

${finalPoseCheck}`;
      } else {
        // ---- NO ATTRIBUTES: Simple photo-based avatar generation ----
        prompt = `${posePriorityInstructions}

${referenceUsageInstructions}

Create a hyper-realistic full-body avatar based on this photo. Beautify the face subtly while preserving the person's exact facial features, skin tone, natural appearance, and overall identity. Preserve their current hairstyle and clothing. ${hairInstructions} ${fullBodyInstructions} Keep clothing unchanged; if the photo is not full body, preserve the outfit and add matching appropriate footwear while extending to full body. Enhance the background to a clean premium studio look that complements the outfit. Maintain photorealism, sharp details, and natural lighting. The final image must look like a professional fashion model photo.

${finalPoseCheck}`;
      }

      console.log(' [GeminiAI] Has user attributes:', hasAnyAttribute);
      console.log(
        ' [GeminiAI] Generated prompt:',
        prompt.substring(0, 150) + '...',
      );

      // Add timeout wrapper for Gemini API call
      console.log(' [GeminiAI] Calling Gemini API...');
      const startTime = Date.now();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Gemini API timeout after 120 seconds')),
          120000,
        );
      });

      const apiPromise = this.imageModel.generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
        { text: prompt },
      ]);

      const result = await Promise.race([apiPromise, timeoutPromise]);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`⏱️ [GeminiAI] API responded in ${elapsed}s`);

      const response = await result.response;
      console.log('📦 [GeminiAI] Processing response...');

      // Check for generated image in response
      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            console.log(
              '✅ [GeminiAI] Professional animated avatar generated!',
            );
            return {
              success: true,
              imageBase64: part.inlineData.data,
            };
          }
        }
      }

      // Gemini didn't return an image
      console.log(
        'ℹ️ [GeminiAI] Gemini analyzed image but did not generate a new image',
      );
      console.log('💡 [GeminiAI] Returning original photo as avatar');

      return { success: true, imageBase64: null };
    } catch (error) {
      console.error(
        '❌ [GeminiAI] Error during avatar generation:',
        error.message,
      );
      console.error('❌ [GeminiAI] Full error:', error);
      // Return success with null to use original image as fallback
      return { success: true, imageBase64: null, error: error.message };
    }
  }

  private async fetchImageAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString('base64');
  }
}
