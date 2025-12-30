import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract Cloudinary public ID from URL
 */
function extractPublicId(url: string): string | null {
    try {
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
}

/**
 * Delete image from Cloudinary
 */
async function deleteFromCloudinary(imageUrl: string): Promise<boolean> {
    try {
        const publicId = extractPublicId(imageUrl);
        if (!publicId) {
            console.warn(`⚠️  Could not extract public ID from: ${imageUrl}`);
            return false;
        }

        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok') {
            console.log(`✅ Deleted from Cloudinary: ${publicId}`);
            return true;
        } else {
            console.warn(`⚠️  Cloudinary deletion failed: ${publicId} - ${result.result}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error deleting from Cloudinary:`, error);
        return false;
    }
}

/**
 * Main cleanup function
 */
async function cleanupAllAuras() {
    console.log('\n🧹 Starting Aura Cleanup Process...\n');

    try {
        // Fetch all auras
        const auras = await prisma.aura.findMany({
            select: {
                aura_id: true,
                user_id: true,
                image_url: true,
                model_url: true,
                generated_avatar_urls: true,
            },
        });

        console.log(`📊 Found ${auras.length} auras to clean up\n`);

        if (auras.length === 0) {
            console.log('✅ No auras to clean up!');
            return;
        }

        let deletedImages = 0;
        let failedImages = 0;

        // Delete images from Cloudinary
        for (const aura of auras) {
            console.log(`\n🔄 Processing Aura ID: ${aura.aura_id} (User: ${aura.user_id})`);

            // Delete image_url
            if (aura.image_url) {
                const success = await deleteFromCloudinary(aura.image_url);
                success ? deletedImages++ : failedImages++;
            }

            // Delete model_url
            if (aura.model_url) {
                const success = await deleteFromCloudinary(aura.model_url);
                success ? deletedImages++ : failedImages++;
            }

            // Delete generated_avatar_urls
            if (Array.isArray(aura.generated_avatar_urls)) {
                for (const url of aura.generated_avatar_urls) {
                    if (url) {
                        const success = await deleteFromCloudinary(url);
                        success ? deletedImages++ : failedImages++;
                    }
                }
            }
        }

        console.log('\n📸 Cloudinary Cleanup Summary:');
        console.log(`   ✅ Successfully deleted: ${deletedImages} images`);
        console.log(`   ❌ Failed to delete: ${failedImages} images\n`);

        // Delete all auras from database
        console.log('🗄️  Deleting auras from database...');
        const deleteResult = await prisma.aura.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.count} auras from database\n`);

        console.log('🎉 Cleanup completed successfully!\n');
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
cleanupAllAuras()
    .then(() => {
        console.log('✅ Script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
