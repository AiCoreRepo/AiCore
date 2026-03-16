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
    bodySize: string;
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
        model: 'gemini-3-pro-image-preview',
        generationConfig: {
          temperature: 0.2,
        } as any,
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
      const prompt = this.buildAvatarPrompt(attributes);

      console.log(
        ' [GeminiAI] Has user attributes:',
        prompt.includes('[USER ATTRIBUTES — OVERRIDE PHOTO WHERE DIFFERENT]'),
      );
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

  private buildAvatarPrompt(
    attributes: AvatarGenerationRequest['attributes'],
  ): string {
    const {
      height,
      weight,
      skinTone,
      gender,
      bodyShape,
      bodySize,
      ageRange,
      hairStyle,
    } = attributes;

    const formatAttr = (value: string) => value.replace(/_/g, ' ');

    const taskSection = `[TASK]
Edit the provided source photo into a single hyper-realistic full-body studio portrait of the exact same person.
This is an identity-preserving image edit, not a redesign and not a new character.
The output must show the full body from top of head to tips of toes.`;

    const poseSection = `[NON-NEGOTIABLE POSE]
The person stands perfectly upright, centered, fully front-facing, and fully symmetrical.
Both legs are straight, vertical, and fully joined together from upper thigh to feet: inner thighs touching, knees touching, calves touching, ankles touching, and feet touching. There must be zero visible gap anywhere between the legs from hip to toe.
Both arms hang straight down vertically at the sides of the body. Elbows are fully straight, shoulders are neutral, forearms are straight, wrists are beside the outer thighs, and hands rest naturally next to the thighs.
The body weight is evenly balanced on both feet. No walking pose, no step forward, no contrapposto, no hip shift, no bent knees, no bent elbows, no arm lift, no hand on hip, no crossed arms.
If the source image pose conflicts with these requirements, keep the same identity and clothing but change the pose to this exact straight joined-leg and straight-arm pose.
If the person is wearing pants, jeans, trousers, a skirt, or a dress, the garment must follow the closed-leg pose. The fabric between the legs must be rendered closed and flat with no crotch gap or separation.`;

    const identitySection = `[IDENTITY PRESERVATION — NON-NEGOTIABLE]
- Copy the person's exact face: bone structure, eye shape, nose, lips, skin tone. Do not idealise or alter facial geometry.
- Copy the person's exact hair: length, volume, texture, color, and silhouette. Do not shorten, trim, tuck, pin back, or reduce hair in any way.
- Copy the person's clothing exactly as worn. Do not change the outfit.
- Preserve the same body identity while only correcting the pose and framing.`;

    const expressionSection = `[EXPRESSION — NON-NEGOTIABLE]
- The final portrait must show a happy, warm, natural smile.
- The expression should feel pleasant, confident, and fashion-editorial appropriate: relaxed eyes, relaxed cheeks, and a clearly smiling mouth.
- If the source photo has a neutral, serious, blank, or tense expression, change it to a gentle smile while preserving the same identity and natural facial proportions.
- Keep the smile tasteful and realistic. Do not generate an exaggerated grin, laughing face, open-mouth laugh, or distorted teeth.`;

    const userAttributeLines: string[] = [];

    if (gender && gender !== 'unspecified') {
      userAttributeLines.push(`- Gender: clearly ${formatAttr(gender)}`);
    }
    if (ageRange) {
      userAttributeLines.push(
        `- Age appearance: ${formatAttr(ageRange)} — reflect in face and body`,
      );
    }
    if (skinTone) {
      userAttributeLines.push(
        `- Skin tone: ${formatAttr(skinTone)} — match exactly, do not lighten or darken`,
      );
    }
    if (bodyShape && bodyShape !== 'average') {
      userAttributeLines.push(
        `- Body shape: ${formatAttr(bodyShape)} silhouette`,
      );
    }
    if (bodySize) {
      userAttributeLines.push(
        `- Body size: ${formatAttr(bodySize)} — match the overall fit and proportions`,
      );
    }
    if (height) {
      userAttributeLines.push(
        `- Height: ~${height} cm — use appropriate body proportions`,
      );
    }
    if (weight) {
      userAttributeLines.push(
        `- Weight: ~${weight} kg — reflect realistic build`,
      );
    }
    if (hairStyle) {
      userAttributeLines.push(
        `- Hair style: ${formatAttr(hairStyle)} — apply this style while keeping the hair length and volume from the source photo intact`,
      );
    }

    const generationRulesSection = `[GENERATION RULES]
- If the source photo is cropped, partial, seated, angled, or not full body, extend or reconstruct it into a complete full-body image in the exact pose above.
- If the lower body is missing, cropped, occluded, or impossible to infer from the source image, complete it with tasteful, modest, full-length lower wear that matches the visible upper outfit and reads as a premium studio portrait.
- Default missing lower wear to elegant full-length trousers, straight pants, churidar, leggings, or an ankle-length skirt when appropriate for the visible top. Keep the result conservative and fashion-appropriate.
- Never leave the lower body nude, bare, underwear-only, bikini-bottom-like, mini-short, hot-short, or revealing. Do not generate exposed upper thighs as the main lower-body completion.
- Keep the person centered with enough space to clearly show the entire silhouette from head to toe.
- Add matching neutral footwear only if the original feet or shoes are missing.
- Background: clean neutral studio backdrop with soft even fashion lighting.
- Output style: hyper-realistic, sharp detail, premium fashion photo, natural anatomy.`;

    const hardNegativesSection = `[HARD NEGATIVES — NEVER GENERATE]
wide stance | legs apart | one leg forward | split stance | walking pose | contrapposto | hip shift | bent knees | bent elbows | arms away from body | one arm forward | raised arm | hand on hip | crossed arms | leg gap | visible crotch gap | trouser gap | pants separation | fabric gap between legs | shortened hair | tied-back hair | altered face shape | different skin tone | cropped feet | partial body | nude lower body | bare legs as missing lower-wear completion | underwear | bikini bottom | mini shorts | hot pants | revealing shorts | sad expression | angry expression | blank expression | frown | exaggerated grin | open-mouth laugh`;

    const finalSelfCheckSection = `[FINAL VALIDATION BEFORE OUTPUT]
Before returning the image, internally verify all of these are true:
1. The full body is visible from head to toe.
2. The legs are straight and fully touching with absolutely no gap anywhere from hip to feet.
3. The arms are straight, vertical, and resting beside the outer thighs.
4. The face, hair, skin tone, and outfit still match the source person exactly.
5. The final face has a happy, natural, clearly smiling expression.
6. If any part of the lower body was reconstructed, the final lower wear is modest, full-length, and suitable for a decent fashion portrait.
If any check fails, correct the image so all checks pass before outputting it.`;

    const sections = [taskSection, poseSection, identitySection, expressionSection];

    if (userAttributeLines.length > 0) {
      sections.push(
        `[USER ATTRIBUTES — OVERRIDE PHOTO WHERE DIFFERENT]
${userAttributeLines.join('\n')}`,
      );
    }

    sections.push(
      generationRulesSection,
      hardNegativesSection,
      finalSelfCheckSection,
    );

    return sections.join('\n\n');
  }
}
