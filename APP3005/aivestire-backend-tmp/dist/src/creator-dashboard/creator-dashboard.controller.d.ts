import { CreatorDashboardService } from './creator-dashboard.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class CreatorDashboardController {
    private readonly creatorDashboardService;
    constructor(creatorDashboardService: CreatorDashboardService);
    getProfile(user: {
        user_id: string;
    }): Promise<{
        name: string;
        subtitle: any;
        avatar: any;
        role: string;
    }>;
    updateProfile(user: {
        user_id: string;
    }, dto: UpdateProfileDto): Promise<{
        name: string;
        subtitle: any;
        avatar: any;
    }>;
    getDashboardMetrics(user: {
        user_id: string;
    }): Promise<{
        totalLikes: number;
        totalUploads: number;
    }>;
    getProducts(user: {
        user_id: string;
    }, page?: number, limit?: number): Promise<{
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
    createProduct(user: {
        user_id: string;
    }, dto: CreateProductDto): Promise<{
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
    updateProduct(user: {
        user_id: string;
    }, productId: string, dto: UpdateProductDto): Promise<{
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
    deleteProduct(user: {
        user_id: string;
    }, productId: string): Promise<{
        message: string;
    }>;
}
