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
                model: 'gemini-2.5-flash-image'
            });
            console.log(' Using Gemini 2.5 Flash Image (Nano Banana) for avatar generation');
        }
    }

    /**
     * Generate professional animated avatar using Gemini AI
     */
    async generateAvatarImage(request: AvatarGenerationRequest): Promise<AvatarImageResponse> {
        if (!this.imageModel) {
            console.log('⚠️ [GeminiAI] Image model not initialized, using original image');
            return { success: true, imageBase64: null };
        }

        try {
            console.log('🎨 Generating professional animated avatar with Gemini 2.5 Flash Image...');

            console.log('📥 [GeminiAI] Fetching source image...');
            const imageBase64 = await this.fetchImageAsBase64(request.imageUrl);
            console.log(`✅ [GeminiAI] Source image fetched: ${imageBase64.length} chars`);

            const { attributes } = request;

            // Build dynamic prompt from user attributes
            const { height, weight, skinTone, gender, bodyShape, ageRange, hairStyle } = attributes;

            // Create attribute descriptions for the prompt
            const attributeDescriptions: string[] = [];

            if (gender && gender !== 'unspecified') {
                attributeDescriptions.push(`${gender} person`);
            }
            if (ageRange) {
                attributeDescriptions.push(`appearing to be in their ${ageRange} age range`);
            }
            if (skinTone) {
                attributeDescriptions.push(`with ${skinTone} skin tone`);
            }
            if (bodyShape && bodyShape !== 'average') {
                attributeDescriptions.push(`with a ${bodyShape} body shape`);
            }
            if (height) {
                attributeDescriptions.push(`approximately ${height}cm tall`);
            }
            if (weight) {
                attributeDescriptions.push(`weighing around ${weight}kg`);
            }
            if (hairStyle) {
                attributeDescriptions.push(`with ${hairStyle} hair`);
            }

            // Build the dynamic prompt incorporating user attributes
            const personDescription = attributeDescriptions.length > 0
                ? `This is a ${attributeDescriptions.join(', ')}. `
                : '';

            const prompt = `${personDescription}Create a hyper-realistic full-body avatar of this person. Beautify the face subtly while preserving their exact facial features and natural ${skinTone || 'original'} skin tone. Maintain their ${hairStyle || 'current'} hairstyle and ${bodyShape || 'natural'} body proportions. Preserve the same posture and expression. Keep clothing unchanged; if the photo is not full body, extend realistically to full body with matching outfit and appropriate footwear that suits a ${gender || 'person'} of this style. Enhance the background to a clean premium studio look that complements the outfit. Maintain photorealism, sharp details, and natural lighting.`;

            console.log('📝 [GeminiAI] Generated dynamic prompt:', prompt.substring(0, 100) + '...');

            // Add timeout wrapper for Gemini API call
            console.log('🚀 [GeminiAI] Calling Gemini API...');
            const startTime = Date.now();

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Gemini API timeout after 120 seconds')), 120000);
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

            const result = await Promise.race([apiPromise, timeoutPromise]) as any;

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`⏱️ [GeminiAI] API responded in ${elapsed}s`);

            const response = await result.response;
            console.log('📦 [GeminiAI] Processing response...');

            // Check for generated image in response
            const candidates = response.candidates;
            if (candidates && candidates[0]?.content?.parts) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        console.log('✅ [GeminiAI] Professional animated avatar generated!');
                        return {
                            success: true,
                            imageBase64: part.inlineData.data,
                        };
                    }
                }
            }

            // Gemini didn't return an image
            console.log('ℹ️ [GeminiAI] Gemini analyzed image but did not generate a new image');
            console.log('💡 [GeminiAI] Returning original photo as avatar');

            return { success: true, imageBase64: null };

        } catch (error) {
            console.error('❌ [GeminiAI] Error during avatar generation:', error.message);
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
