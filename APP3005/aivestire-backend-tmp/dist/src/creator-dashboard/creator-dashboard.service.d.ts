import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '../common/cloudinary.service';
export declare class CreatorDashboardService {
    private readonly prisma;
    private readonly cloudinaryService;
    private readonly logger;
    constructor(prisma: PrismaService, cloudinaryService: CloudinaryService);
    private getCreatorIdFromUserId;
    private slugify;
    getCreatorDashboardMetrics(userId: string): Promise<{
        totalLikes: number;
        totalUploads: number;
        latestImages: string[];
    }>;
    getCreatorProducts(userId: string, page?: number, limit?: number): Promise<{
        data: {
            product_id: string;
            name: string;
            title: string;
            description: string | null;
            image_url: string | null;
            images: string[];
            price_cents: number;
            currency: string;
            inventory_count: number;
            status: string;
            tags: {
                name: string;
            }[];
            stats: {
                likes_count: number;
                tries_count: number;
                conversion_rate: number;
                views: number;
                comments_count: number;
            };
            created_at: Date;
            updated_at: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createProduct(userId: string, dto: CreateProductDto): Promise<{
        status: string;
        created_at: Date;
        creator_id: string;
        title: string;
        description: string | null;
        price_cents: number;
        currency: string;
        inventory_count: number;
        product_id: string;
        slug: string;
        is_deleted: boolean;
        max_images: number;
        updated_at: Date | null;
    }>;
    updateProduct(userId: string, productId: string, dto: UpdateProductDto): Promise<{
        product_id: string;
        name: string;
        title: string;
        description: string | null;
        image_url: string | null;
        price_cents: number;
        currency: string;
        inventory_count: number;
        status: string;
        tags: {
            name: string;
        }[];
        stats: {
            likes_count: number;
            tries_count: number;
            conversion_rate: number;
            views: number;
            comments_count: number;
        };
        created_at: Date;
        updated_at: Date | null;
    }>;
    deleteProduct(userId: string, productId: string): Promise<{
        message: string;
        totalUploads: number;
        latestImages: string[];
    }>;
    updateCreatorProfile(userId: string, dto: any): Promise<{
        name: string;
        subtitle: any;
        avatar: any;
    }>;
    getCreatorProfile(userId: string): Promise<{
        name: string;
        subtitle: any;
        avatar: any;
        role: string;
    }>;
    private getProductById;
}
