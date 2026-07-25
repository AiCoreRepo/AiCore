import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AURA_GEMINI_TIMEOUT,
  GEMINI_TRYON_CONFIG,
} from '../ai-tryon/constants/tryon.constants';

const GEMINI_FEMALE_REFERENCE_TRYON_IMAGE_URL =
  'https://res.cloudinary.com/dgbmqarp0/image/upload/v1773814263/Pasted_image_28_d0kt0b.png';
const GEMINI_MALE_REFERENCE_TRYON_IMAGE_URL =
  'https://res.cloudinary.com/dxfxicebq/image/upload/v1784959798/aivestire/tryon/guest-demo-male/male1-collection.png';

// [Speed-Opt-1] Module-level cache — the reference clothing image is ~1.9MB fetched
// via HTTP on every job. Cache it once per worker-process lifetime (survives job re-runs).
const cachedReferenceImages = new Map<string, GeminiInlineImage>();

interface GeminiInlineImage {
  mimeType: string;
  data: string;
}

export interface AvatarGenerationRequest {
  imageUrl: string;
  sourceImageData?: string; // [OPTIMIZATION Task 3] Added direct base64 pass-through to skip Cloudinary upload
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
  private readonly logger = new Logger(GeminiAIService.name);
  private genAI: GoogleGenerativeAI;
  private imageModel: any;
  private readonly timingLogsEnabled: boolean;
  private readonly auraGeminiTimeoutMs: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.timingLogsEnabled =
      String(this.configService.get<string>('AI_TIMING_LOGS') || '').toLowerCase() ===
      'true';
    this.auraGeminiTimeoutMs = AURA_GEMINI_TIMEOUT;
    if (!apiKey) {
      console.warn(' GEMINI_API_KEY not configured');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Gemini 3.1 Flash Image supports image output required for Aura generation.
      this.imageModel = this.genAI.getGenerativeModel({
        model: GEMINI_TRYON_CONFIG.DEFAULT_MODEL,
        generationConfig: {
          temperature: 0.2,
          // [Speed-Opt-3] Tell Gemini to only return an image — skips text token generation
          responseModalities: ['IMAGE'],
        } as any,
      });
      console.log(
        `✅ Using ${GEMINI_TRYON_CONFIG.DEFAULT_MODEL} for avatar (Aura) generation`,
      );
      console.log(
        `✅ [GeminiAI] Aura Gemini timeout configured: ${this.auraGeminiTimeoutMs}ms`,
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
        '⚠️ [GeminiAI] Image model not initialized',
      );
      return {
        success: false,
        imageBase64: null,
        error: 'Gemini image model is not initialized',
      };
    }

    const totalStartTime = Date.now();
    let sourceFetchMs = 0;
    let referenceFetchMs = 0;
    let promptBuildMs = 0;
    let apiMs = 0;
    let responseParseMs = 0;

    try {
      console.log(
        `🎨 Generating professional avatar with ${GEMINI_TRYON_CONFIG.DEFAULT_MODEL}...`,
      );

      console.log('📥 [GeminiAI] Fetching source image...');
      const sourceFetchStart = Date.now();
      // [OPTIMIZATION Task 3] If sourceImageData is provided, use it directly instead of fetching URL
      const sourceImage = request.sourceImageData
        ? this.processBase64ToInlineData(request.sourceImageData)
        : await this.fetchImageAsInlineData(request.imageUrl);
      sourceFetchMs = Date.now() - sourceFetchStart;
      console.log(
        `✅ [GeminiAI] Source image fetched: ${sourceImage.data.length} chars`,
      );

      // [Speed-Opt-1] Serve reference clothing image from in-memory cache.
      // First call fetches + shrinks (~512×512); subsequent calls return instantly.
      console.log('📥 [GeminiAI] Fetching reference try-on clothing image...');
      const referenceFetchStart = Date.now();
      const avatarGender =
        request.attributes.gender?.trim().toLowerCase() === 'male'
          ? 'male'
          : 'female';
      const referenceImageUrl =
        avatarGender === 'male'
          ? GEMINI_MALE_REFERENCE_TRYON_IMAGE_URL
          : GEMINI_FEMALE_REFERENCE_TRYON_IMAGE_URL;
      let clothingImage = cachedReferenceImages.get(avatarGender);
      if (!clothingImage) {
        console.log(
          ` [GeminiAI] ${avatarGender} reference cache miss — fetching & shrinking...`,
        );
        clothingImage = await this.fetchAndShrinkReferenceImage(
          referenceImageUrl,
        );
        cachedReferenceImages.set(avatarGender, clothingImage);
      } else {
        console.log(
          ` [GeminiAI] ${avatarGender} reference image served from cache ⚡`,
        );
      }
      referenceFetchMs = Date.now() - referenceFetchStart;
      console.log(
        `✅ [GeminiAI] Reference clothing image ready: ${clothingImage.data.length} chars`,
      );

      const { attributes } = request;
      const promptBuildStart = Date.now();
      const prompt = this.buildAvatarPrompt(attributes);
      promptBuildMs = Date.now() - promptBuildStart;

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

      // Keep Aura under the Bull job timeout while allowing slower prod Gemini responses.
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                `Gemini API timeout after ${Math.round(this.auraGeminiTimeoutMs / 1000)} seconds`,
              ),
            ),
          this.auraGeminiTimeoutMs,
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

      apiMs = Date.now() - startTime;
      const elapsed = (apiMs / 1000).toFixed(2);
      console.log(`⏱️ [GeminiAI] API responded in ${elapsed}s`);

      const responseParseStart = Date.now();
      const response = await result.response;
      responseParseMs = Date.now() - responseParseStart;
      console.log('📦 [GeminiAI] Processing response...');

      // Check for generated image in response
      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            console.log(
              '✅ [GeminiAI] Professional animated avatar generated!',
            );
            const totalMs = Date.now() - totalStartTime;
            this.logTiming(
              `success total=${this.formatDuration(totalMs)} source_fetch=${this.formatDuration(sourceFetchMs)} reference_fetch=${this.formatDuration(referenceFetchMs)} prompt=${this.formatDuration(promptBuildMs)} api=${this.formatDuration(apiMs)} response_parse=${this.formatDuration(responseParseMs)}`,
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
      this.logResponseDiagnostics(response);
      const totalMs = Date.now() - totalStartTime;
      this.logTiming(
        `no-image total=${this.formatDuration(totalMs)} source_fetch=${this.formatDuration(sourceFetchMs)} reference_fetch=${this.formatDuration(referenceFetchMs)} prompt=${this.formatDuration(promptBuildMs)} api=${this.formatDuration(apiMs)} response_parse=${this.formatDuration(responseParseMs)}`,
      );

      return {
        success: false,
        imageBase64: null,
        error: 'Gemini did not generate an avatar image',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown avatar generation error';
      console.error(
        '❌ [GeminiAI] Error during avatar generation:',
        errorMessage,
      );
      console.error('❌ [GeminiAI] Full error:', error);
      this.logTiming(
        `failed total=${this.formatDuration(Date.now() - totalStartTime)} source_fetch=${this.formatDuration(sourceFetchMs)} reference_fetch=${this.formatDuration(referenceFetchMs)} prompt=${this.formatDuration(promptBuildMs)} api=${this.formatDuration(apiMs)} response_parse=${this.formatDuration(responseParseMs)} error=${errorMessage}`,
      );
      return { success: false, imageBase64: null, error: errorMessage };
    }
  }

  /**
   * [OPTIMIZATION Task 9] Simple ping to parse configuration and warm up internal http clients 
   * to avoid complete cold starts on the serverless functions/GPU.
   */
  async ping(): Promise<boolean> {
    try {
      this.logger.log('🔥 [WarmWorker] Pinging Gemini AI Service...');
      if (!this.genAI) return false;
      // We don't want to actually spend tokens/money on a real image ping 
      // but just keeping the module hot in Node's memory is step 1.
      return true;
    } catch (e) {
      return false;
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

  /**
   * [Speed-Opt-2] Fetch the reference clothing image and shrink it to 512×512 JPEG.
   * Sending the full ~1.9MB image to Gemini wastes prefill budget. 512×512 is enough
   * for the model to understand the clothing style, colour, and silhouette.
   */
  private async fetchAndShrinkReferenceImage(
    referenceImageUrl: string,
  ): Promise<GeminiInlineImage> {
    const response = await fetch(referenceImageUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch reference clothing image (${response.status})`,
      );
    }
    const rawBuffer = Buffer.from(await response.arrayBuffer());

    // Dynamically import sharp to keep the same pattern as the rest of the codebase
    const sharp = (await import('sharp')).default;
    const shrunkBuffer = await sharp(rawBuffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 75, mozjpeg: true })
      .toBuffer();

    console.log(
      `[Speed-Opt-2] Reference image shrunk: ${rawBuffer.length} → ${shrunkBuffer.length} bytes`,
    );

    return {
      mimeType: 'image/jpeg',
      data: shrunkBuffer.toString('base64'),
    };
  }

  // [OPTIMIZATION Task 3] Helper to process raw base64 data directly without HTTP fetch
  private processBase64ToInlineData(base64Data: string): GeminiInlineImage {
    if (base64Data.startsWith('data:')) {
      const [header, data] = base64Data.split(',', 2);
      const mimeType = header.match(/^data:(.*?);base64$/)?.[1] || 'image/jpeg';
      return { mimeType, data };
    }
    
    // Assume JPEG if no data URI header
    return {
      mimeType: 'image/jpeg',
      data: base64Data,
    };
  }

  private logResponseDiagnostics(response: any): void {
    try {
      const candidates = Array.isArray(response?.candidates)
        ? response.candidates
        : [];

      console.log(
        `🔎 [GeminiAI] Response diagnostics: candidates=${candidates.length}`,
      );

      candidates.forEach((candidate: any, candidateIndex: number) => {
        const parts = Array.isArray(candidate?.content?.parts)
          ? candidate.content.parts
          : [];
        const finishReason = candidate?.finishReason || 'unknown';
        const safetyRatingsCount = Array.isArray(candidate?.safetyRatings)
          ? candidate.safetyRatings.length
          : 0;
        const tokenCount =
          candidate?.tokenCount ??
          candidate?.usageMetadata?.candidatesTokenCount ??
          'unknown';

        console.log(
          `🔎 [GeminiAI] Candidate ${candidateIndex}: finishReason=${finishReason} parts=${parts.length} safetyRatings=${safetyRatingsCount} tokenCount=${tokenCount}`,
        );

        parts.forEach((part: any, partIndex: number) => {
          const hasInlineImage = Boolean(part?.inlineData?.data);
          const inlineMimeType = part?.inlineData?.mimeType || 'n/a';
          const textPreview =
            typeof part?.text === 'string' && part.text.trim().length > 0
              ? part.text.trim().replace(/\s+/g, ' ').slice(0, 180)
              : '';

          console.log(
            `🔎 [GeminiAI] Candidate ${candidateIndex} part ${partIndex}: hasImage=${hasInlineImage} mimeType=${inlineMimeType} textPreview=${textPreview || '<none>'}`,
          );
        });
      });

      if (response?.promptFeedback) {
        console.log(
          `🔎 [GeminiAI] Prompt feedback: ${JSON.stringify(response.promptFeedback)}`,
        );
      }
    } catch (diagnosticError: any) {
      console.warn(
        `[GeminiAI] Failed to log response diagnostics: ${diagnosticError?.message || 'unknown error'}`,
      );
    }
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
        gender:
          'The gender in person_attributes is authoritative for the generated avatar. When it is male, create a clearly male avatar wearing the male reference outfit. When it is female, create a clearly female avatar wearing the female reference outfit. Never silently default a male request to a female avatar.',
        identity:
          "Preserve the person's exact face features, skin tone, hairline, hairstyle, hair length, hair volume, hair texture, and body type exactly. Keep the same identity from Image 1 without beautifying, reshaping, or simplifying the face or hair. If the source image is cropped, zoomed, or half-body, expand the canvas and reconstruct the missing framing so the complete head and full hair silhouette are visible naturally. Use the provided person_attributes to reconstruct the full body naturally if only a selfie or half-body is given. If height is provided in person_attributes, that height is authoritative and must override any apparent proportions from Image 1 or Image 2. Maintain natural human anatomy and realistic proportions throughout, including a correct head-to-body ratio, centered neck placement, aligned shoulders, and proportional torso, arms, hands, legs, and feet.",
        clothing:
          'Apply ONLY the full visible outfit from Image 2 faithfully. Keep all colors, patterns, textures, trims, embroidery, silhouette, neckline, sleeves, layering, shoes, jewelry, and accessories that are visible in Image 2 intact. Make the person from Image 1 actually wear the Image 2 outfit naturally on their body. The clothing must look worn by the person, not pasted on, floating, overlaid, or shown as a separate product shot. Scale and fit the outfit to the real person described in person_attributes, not to the mannequin or model proportions seen in Image 2.',
        output:
          'Full body (head to toe), full head visible with all hair fully in frame, generous headroom above the hair, visible side margin around the hair silhouette, confident standing pose, happy closed-mouth smile, no visible teeth, clean studio background, soft lighting, photorealistic quality, and a proportionally balanced full-body portrait. Use a vertical portrait composition, approximately 2:3, never a wide cinematic or landscape frame. The person should occupy most of the frame height naturally and must not appear tiny inside a large empty background. The final image must clearly show that the person from Image 1 is wearing the full outfit from Image 2.',
      },
      constraints: [
        'Return exactly one newly generated avatar image',
        'Do NOT crop the output',
        'Do NOT crop, trim, cut off, or hide any part of the hair, head, or forehead',
        'Do NOT let the hair, head, or forehead touch the top or side edges of the image',
        'Do NOT zoom in so tightly that the full hair silhouette is not visible',
        'Do NOT output a horizontal, panoramic, or ultra-wide composition',
        'Do NOT return Image 1 unchanged',
        'Do NOT return Image 2 unchanged',
        'Do NOT leave the original outfit from Image 1 in place with only tiny edits',
        'Do NOT create a collage, side-by-side panel, before/after layout, product board, or multiple people',
        'Do NOT distort or change the face',
        'Do NOT change face shape, eye shape, nose, lips, jawline, or hairline',
        'Do NOT stretch, squeeze, elongate, shrink, warp, or tilt the face, head, neck, shoulders, torso, arms, hands, hips, legs, or feet',
        'Do NOT generate an oversized face, undersized face, floating face, or mismatched face-to-body scale',
        'Do NOT generate unnatural anatomy, broken limb proportions, merged limbs, duplicated limbs, or misaligned shoulders',
        'Do NOT make the person look shrunken, distant, or vertically compressed inside the frame',
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

  private logTiming(message: string): void {
    if (!this.timingLogsEnabled) {
      return;
    }

    this.logger.log(`[AvatarGeminiTiming] ${message}`);
  }

  private formatDuration(durationMs: number): string {
    return `${durationMs}ms/${(durationMs / 1000).toFixed(2)}s`;
  }
}
