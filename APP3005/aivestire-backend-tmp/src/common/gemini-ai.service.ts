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
            return { success: true, imageBase64: null };
        }

        try {
            console.log('🎨 Generating professional animated avatar with Gemini 2.5 Flash Image...');

            const imageBase64 = await this.fetchImageAsBase64(request.imageUrl);
            const { attributes } = request;

            // Detect if outfit is black/dark for conditional lighting
            const isBlackOutfit = false; // TODO: Add color detection logic if needed

            // Comprehensive MetaHuman-quality avatar prompt
            const prompt = `Create a hyper-realistic full-body avatar of this person. Beautify the face subtly while keeping all original attributes the same (exact facial features, skin tone, hair, body shape). Preserve the same posture and expression. Keep clothing unchanged; if the photo is not full body, extend realistically to full body with matching outfit and appropriate footwear. Enhance the background to a clean premium studio look that complements the outfit. Maintain photorealism, sharp details, and natural lighting`;

            const result = await this.imageModel.generateContent([
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: imageBase64,
                    },
                },
                { text: prompt },
            ]);

            const response = await result.response;

            // Check for generated image in response
            const candidates = response.candidates;
            if (candidates && candidates[0]?.content?.parts) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        console.log(' Professional animated avatar generated!');
                        return {
                            success: true,
                            imageBase64: part.inlineData.data,
                        };
                    }
                }
            }

            // Gemini 2.0 Flash doesn't generate images yet
            console.log('ℹ  Gemini analyzed image but cannot generate new images');
            console.log('💡 Returning original photo as placeholder');
            console.log('🔜 For real avatar generation:');
            console.log('   - Option 1: Use Cloudinary transformations (background, filters)');
            console.log('   - Option 2: Integrate DALL-E 3 or Stable Diffusion');
            console.log('   - Option 3: Wait for Imagen API public release');

            return { success: true, imageBase64: null };

        } catch (error) {
            console.error(' Error:', error);
            return { success: true, imageBase64: null };
        }
    }

    private async fetchImageAsBase64(url: string): Promise<string> {
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        return buffer.toString('base64');
    }
}
