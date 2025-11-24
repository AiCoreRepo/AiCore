import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '../common/cloudinary.service';
export declare class ProductsService {
    private prisma;
    private cloudinaryService;
    constructor(prisma: PrismaService, cloudinaryService: CloudinaryService);
    create(dto: CreateProductDto): Promise<{
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
    update(id: string, dto: UpdateProductDto): Promise<{
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
    submitForApproval(id: string): Promise<{
        message: string;
    }>;
}
