import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_REFERENCE_TRYON_IMAGE_URL =
  'https://res.cloudinary.com/dgbmqarp0/image/upload/v1773814263/Pasted_image_28_d0kt0b.png';

interface GeminiInlineImage {
  mimeType: string;
  data: string;
}

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
        model: 'gemini-3.1-flash-image-preview',
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
      const sourceImage = await this.fetchImageAsInlineData(request.imageUrl);
      console.log(
        `✅ [GeminiAI] Source image fetched: ${sourceImage.data.length} chars`,
      );

      console.log('📥 [GeminiAI] Fetching reference try-on clothing image...');
      const clothingImage = await this.fetchImageAsInlineData(
        GEMINI_REFERENCE_TRYON_IMAGE_URL,
      );
      console.log(
        `✅ [GeminiAI] Reference clothing image fetched: ${clothingImage.data.length} chars`,
      );

      const { attributes } = request;
      const prompt = this.buildAvatarPrompt(attributes);

      console.log(
        ' [GeminiAI] Has structured person attributes:',
        prompt.includes('"person_attributes"'),
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
            mimeType: sourceImage.mimeType,
            data: sourceImage.data,
          },
        },
        {
          inlineData: {
            mimeType: clothingImage.mimeType,
            data: clothingImage.data,
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

  private async fetchImageAsInlineData(
    url: string,
  ): Promise<GeminiInlineImage> {
    if (url.startsWith('data:')) {
      const [header, data] = url.split(',', 2);
      const mimeType = header.match(/^data:(.*?);base64$/)?.[1] || 'image/jpeg';

      return {
        mimeType,
        data,
      };
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Gemini image input: ${url} (${response.status})`,
      );
    }
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      mimeType,
      data: buffer.toString('base64'),
    };
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
    const age = this.extractRepresentativeAge(ageRange);

    const prompt = {
      role: 'virtual try-on assistant',
      inputs: {
        image_1: 'person',
        image_2: 'clothing',
      },
      person_attributes: {
        ...(height ? { height: this.convertCmToFeetInches(height) } : {}),
        ...(height ? { height_cm: height } : {}),
        ...(bodyShape ? { body_shape: formatAttr(bodyShape) } : {}),
        ...(skinTone ? { skin_tone: formatAttr(skinTone) } : {}),
        ...(age !== undefined ? { age } : {}),
        ...(gender ? { gender: formatAttr(gender) } : {}),
        ...(bodySize ? { body_size: formatAttr(bodySize) } : {}),
        ...(weight ? { weight_kg: weight } : {}),
        ...(hairStyle ? { hair_style: formatAttr(hairStyle) } : {}),
      },
      instructions: {
        identity:
          "Preserve the person's exact face features, skin tone, hairline, hairstyle, hair length, hair volume, hair texture, and body type exactly. Keep the same identity from Image 1 without beautifying, reshaping, or simplifying the face or hair. If the source image is cropped, zoomed, or half-body, expand the canvas and reconstruct the missing framing so the complete head and full hair silhouette are visible naturally. Use the provided person_attributes to reconstruct the full body naturally if only a selfie or half-body is given. If height is provided in person_attributes, that height is authoritative and must override any apparent proportions from Image 1 or Image 2. Maintain natural human anatomy and realistic proportions throughout, including a correct head-to-body ratio, centered neck placement, aligned shoulders, and proportional torso, arms, hands, legs, and feet.",
        clothing:
          'Apply ONLY the full visible outfit from Image 2 faithfully. Keep all colors, patterns, textures, trims, embroidery, silhouette, neckline, sleeves, layering, shoes, jewelry, and accessories that are visible in Image 2 intact. Make the person from Image 1 actually wear the Image 2 outfit naturally on their body. The clothing must look worn by the person, not pasted on, floating, overlaid, or shown as a separate product shot. Scale and fit the outfit to the real person described in person_attributes, not to the mannequin or model proportions seen in Image 2.',
        output:
          'Full body (head to toe), full head visible with all hair fully in frame, generous headroom above the hair, visible side margin around the hair silhouette, confident standing pose, happy closed-mouth smile, no visible teeth, clean studio background, soft lighting, photorealistic quality, and a proportionally balanced full-body portrait. The final image must clearly show that the person from Image 1 is wearing the full outfit from Image 2.',
      },
      constraints: [
        'Return exactly one newly generated avatar image',
        'Do NOT crop the output',
        'Do NOT crop, trim, cut off, or hide any part of the hair, head, or forehead',
        'Do NOT let the hair, head, or forehead touch the top or side edges of the image',
        'Do NOT zoom in so tightly that the full hair silhouette is not visible',
        'Do NOT return Image 1 unchanged',
        'Do NOT return Image 2 unchanged',
        'Do NOT leave the original outfit from Image 1 in place with only tiny edits',
        'Do NOT create a collage, side-by-side panel, before/after layout, product board, or multiple people',
        'Do NOT distort or change the face',
        'Do NOT change face shape, eye shape, nose, lips, jawline, or hairline',
        'Do NOT stretch, squeeze, elongate, shrink, warp, or tilt the face, head, neck, shoulders, torso, arms, hands, hips, legs, or feet',
        'Do NOT generate an oversized face, undersized face, floating face, or mismatched face-to-body scale',
        'Do NOT generate unnatural anatomy, broken limb proportions, merged limbs, duplicated limbs, or misaligned shoulders',
        'Do NOT shorten, restyle, flatten, tie back, or simplify the hair',
        'Do NOT alter ethnicity or body type',
        'Do NOT use the mannequin or clothing-model height, leg length, or body proportions from Image 2',
        'Do NOT let Image 2 override the height specified in person_attributes',
        'Do NOT show teeth in the smile',
        'Do NOT carry over any ornaments, jewelry, rings, necklaces, earrings, or accessories from Image 1',
        'Do NOT carry over any bags, purses, handbags, or carried items from Image 1',
        'Do NOT carry over any hats, caps, sunglasses, or headwear from Image 1',
        'ONLY the full visible outfit from Image 2 should appear on the final avatar',
      ],
    };

    return JSON.stringify(prompt, null, 2);
  }

  private convertCmToFeetInches(heightCm: number): string {
    const totalInches = Math.round(heightCm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;

    return `${feet}'${inches}"`;
  }

  private extractRepresentativeAge(ageRange: string): number | undefined {
    if (!ageRange) {
      return undefined;
    }

    const matches = ageRange.match(/\d+/g);
    if (!matches || matches.length === 0) {
      return undefined;
    }

    return Number(matches[0]);
  }
}
