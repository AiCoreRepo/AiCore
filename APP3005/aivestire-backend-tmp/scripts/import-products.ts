import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const prisma = new PrismaClient();

// Configure Cloudinary (get these from your .env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface ProductData {
    title: string;
    category: string;
    description: string;
    price_cents: number;
    occasions: string[];
    body_shapes: string[];
    skin_tones: string[];
    sizes: string[];
    fit: string[];
    fabric: string[];
    color_family: string[];
    style: string[];
}

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(imagePath: string, productId: string): Promise<string> {
    try {
        console.log(`📤 Uploading ${path.basename(imagePath)} to Cloudinary...`);

        const result = await cloudinary.uploader.upload(imagePath, {
            folder: 'products',
            public_id: productId,
            resource_type: 'image',
            overwrite: true,
        });

        console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
        return result.secure_url;
    } catch (error) {
        console.error(`❌ Failed to upload ${imagePath}:`, error);
        throw error;
    }
}

/**
 * Create product in database
 */
async function createProduct(
    imageUrl: string,
    productData: ProductData,
    creatorId: string,
): Promise<string> {
    try {
        // Generate slug from title
        const slug = productData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Create product
        const product = await prisma.product.create({
            data: {
                creator_id: creatorId,
                title: productData.title,
                slug: slug,
                description: productData.description,
                category: productData.category,
                price_cents: productData.price_cents,
                status: 'APPROVED',
                is_deleted: false,
                metadata: {
                    occasions: productData.occasions,
                    body_shapes: productData.body_shapes,
                    skin_tones: productData.skin_tones,
                    sizes: productData.sizes,
                    fit: productData.fit,
                    fabric: productData.fabric,
                    color_family: productData.color_family,
                    style: productData.style,
                },
            },
        });

        // Create product image
        await prisma.productImage.create({
            data: {
                product_id: product.product_id,
                url: imageUrl,
                is_primary: true,
            },
        });

        console.log(`✅ Created product: ${product.title} (${product.product_id})`);
        return product.product_id;
    } catch (error) {
        console.error(`❌ Failed to create product:`, error);
        throw error;
    }
}

/**
 * Parse product data from filename or use defaults
 * You can customize this to extract data from filename or a CSV file
 */
function parseProductData(filename: string, index: number): ProductData {
    // Example: Extract category from filename like "dress_001.jpg" -> "Dress"
    const nameWithoutExt = path.parse(filename).name;
    const parts = nameWithoutExt.split('_');

    const category = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Clothing';

    return {
        title: `${category} ${index + 1}`,
        category: category,
        description: `Beautiful ${category.toLowerCase()} perfect for various occasions`,
        price_cents: Math.floor(Math.random() * 10000) + 2000, // Random price between ₹20-₹120
        occasions: ['Formal', 'Party', 'Casual luxury'], // Default occasions
        body_shapes: ['Rectangle', 'Hourglass', 'Pear Shape', 'Apple Shape', 'Inverted Triangle'],
        skin_tones: ['Light', 'Medium', 'Dusky', 'Deep'],
        sizes: ['S', 'M', 'L', 'XL'],
        fit: ['Regular Fit'],
        fabric: ['Cotton', 'Polyester'],
        color_family: ['Blue', 'Black', 'White'],
        style: ['Casual', 'Formal'],
    };
}

/**
 * Main function to import products from folder
 */
async function importProductsFromFolder(
    folderPath: string,
    creatorId: string,
    imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'],
) {
    try {
        console.log(`\n🚀 Starting product import from: ${folderPath}\n`);

        // Check if folder exists
        if (!fs.existsSync(folderPath)) {
            throw new Error(`Folder not found: ${folderPath}`);
        }

        // Read all files from folder
        const files = await readdir(folderPath);

        // Filter image files
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
        });

        console.log(`📁 Found ${imageFiles.length} images in folder\n`);

        if (imageFiles.length === 0) {
            console.log('⚠️  No images found in folder');
            return;
        }

        let successCount = 0;
        let failCount = 0;

        // Process each image
        for (let i = 0; i < imageFiles.length; i++) {
            const filename = imageFiles[i];
            const imagePath = path.join(folderPath, filename);

            try {
                console.log(`\n[${i + 1}/${imageFiles.length}] Processing: ${filename}`);

                // Parse product data from filename
                const productData = parseProductData(filename, i);

                // Generate product ID
                const productId = `product_${Date.now()}_${i}`;

                // Upload to Cloudinary
                const imageUrl = await uploadToCloudinary(imagePath, productId);

                // Create product in database
                await createProduct(imageUrl, productData, creatorId);

                successCount++;
            } catch (error) {
                console.error(`❌ Failed to process ${filename}:`, error);
                failCount++;
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ Import complete!`);
        console.log(`   Success: ${successCount}`);
        console.log(`   Failed: ${failCount}`);
        console.log(`${'='.repeat(60)}\n`);

    } catch (error) {
        console.error('❌ Import failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example 1: Import from a folder with default settings
async function example1() {
    const folderPath = 'C:/Users/ATUL/OneDrive/Desktop/Aivestire_New/AiCore/APP3005_AI/recommend_demo/testiing_image_collection';
    const creatorId = 'your-admin-user-id'; // Replace with actual admin user ID

    await importProductsFromFolder(folderPath, creatorId);
}

// Example 2: Import with custom data from CSV
async function example2WithCSV() {
    // You can create a CSV file with columns:
    // filename, title, category, description, price, occasions, body_shapes, etc.

    // Then read the CSV and pass custom data to createProduct
    console.log('CSV import example - implement based on your CSV structure');
}

// Run the script
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log(`
Usage: ts-node import-products.ts <folder_path> <creator_user_id>

Example:
  ts-node import-products.ts "C:/path/to/images" "user-id-123"

Options:
  folder_path     - Path to folder containing product images
  creator_user_id - User ID of the product creator (admin)
        `);
        process.exit(1);
    }

    const [folderPath, creatorId] = args;

    importProductsFromFolder(folderPath, creatorId)
        .then(() => {
            console.log('✅ All done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

export { importProductsFromFolder, parseProductData };
