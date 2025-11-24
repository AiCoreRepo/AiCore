import { CreatorDashboardService } from './creator-dashboard.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class CreatorDashboardController {
    private readonly creatorDashboardService;
    constructor(creatorDashboardService: CreatorDashboardService);
    getDashboardMetrics(user: {
        user_id: string;
    }): Promise<{
        totalLikes: number;
        totalReviews: number;
        totalSalesCents: number;
        totalUploads: number;
        averageRating: number;
    }>;
    getReviews(user: {
        user_id: string;
    }): Promise<{
        user_id: string;
        created_at: Date;
        product_id: string;
        review_id: string;
        rating: number | null;
        comment: string | null;
    }[]>;
    getSalesByMonth(user: {
        user_id: string;
    }): Promise<{
        month: string;
        total_cents: number;
    }[]>;
    getProducts(user: {
        user_id: string;
    }): Promise<{
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
    }[]>;
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
