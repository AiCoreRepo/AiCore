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
            `- Hair: The person has ${formatAttr(hairStyle)} hair. The avatar MUST have ${formatAttr(hairStyle)} hair style.`,
          );
        }

        prompt = `You are generating a hyper-realistic full-body avatar based on the reference photo AND the following user-specified attributes. The attributes below are PROVIDED BY THE USER and MUST take priority over what you see in the photo.

USER-SPECIFIED ATTRIBUTES (MUST FOLLOW):
${specificInstructions.join('\n')}

INSTRUCTIONS:
1. Use the reference photo for facial features, expression, and overall likeness.
2. CRITICALLY IMPORTANT: Apply ALL the user-specified attributes above to the generated avatar. These attributes OVERRIDE what you observe in the photo.
3. Beautify the face subtly while preserving the person's recognizable facial features.
4. Create a full-body avatar. If the photo is not full body, extend realistically to full body with matching outfit and appropriate footwear.
5. Use a simple neutral fashion pose. The body should face forward or slightly 3/4, with both legs closed together in a straight natural stance. Keep the inner thighs, knees, calves, and ankles nearly touching so there is minimal or no visible gap between the legs. Do not create a wide stance, separated legs, or a walking pose. Both legs must remain fully visible, complete, and anatomically correct.
6. Keep both hands in a natural, relaxed, aesthetically pleasing pose near the sides or lightly in front of the body. Fingers must be well-formed and realistic. Avoid awkward, twisted, cropped, hidden, extra, or malformed hands.
7. Keep the existing clothing unchanged but ensure it looks clean and well-fitted.
8. Set the background to a clean, premium studio look with soft, natural lighting.
9. Maintain photorealism with sharp details throughout.
10. The final image must look like a professional fashion model photo.`;
      } else {
        // ---- NO ATTRIBUTES: Simple photo-based avatar generation ----
        prompt = `Create a hyper-realistic full-body avatar based on this photo. Beautify the face subtly while preserving the person's exact facial features, skin tone, and natural appearance. Maintain their current hairstyle and body proportions. Preserve the same expression and overall likeness. Use a simple neutral fashion pose with both legs closed together in a straight natural stance. Keep the inner thighs, knees, calves, and ankles nearly touching so there is minimal or no visible gap between the legs. Do not create a wide stance, separated legs, or a walking pose. Make sure both legs are fully visible, complete, and anatomically correct. Keep both hands in a natural, relaxed, aesthetically pleasing pose with realistic fingers, avoiding awkward, twisted, cropped, hidden, extra, or malformed hands. Keep clothing unchanged; if the photo is not full body, extend realistically to full body with matching outfit and appropriate footwear. Enhance the background to a clean premium studio look that complements the outfit. Maintain photorealism, sharp details, and natural lighting. The final image must look like a professional fashion model photo.`;
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
