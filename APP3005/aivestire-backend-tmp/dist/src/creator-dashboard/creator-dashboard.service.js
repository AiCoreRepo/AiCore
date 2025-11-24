"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CreatorDashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cloudinary_service_1 = require("../common/cloudinary.service");
const nanoid_1 = require("nanoid");
let CreatorDashboardService = CreatorDashboardService_1 = class CreatorDashboardService {
    prisma;
    cloudinaryService;
    logger = new common_1.Logger(CreatorDashboardService_1.name);
    constructor(prisma, cloudinaryService) {
        this.prisma = prisma;
        this.cloudinaryService = cloudinaryService;
    }
    async getCreatorIdFromUserId(userId) {
        const creator = await this.prisma.creator.findUnique({
            where: { user_id: userId },
            select: { creator_id: true },
        });
        if (!creator) {
            throw new common_1.NotFoundException('Creator profile not found');
        }
        return creator.creator_id;
    }
    slugify(input) {
        return input
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    async getCreatorDashboardMetrics(userId) {
        const creatorId = await this.getCreatorIdFromUserId(userId);
        const products = await this.prisma.product.findMany({
            where: { creator_id: creatorId },
            include: {
                stats: true,
                reviews: true,
                orders: true,
            },
        });
        let totalLikes = 0;
        let totalReviews = 0;
        let totalSalesCents = 0;
        let totalRating = 0;
        let ratedReviewsCount = 0;
        for (const product of products) {
            if (product.stats) {
                totalLikes += product.stats.likes_count;
            }
            totalReviews += product.reviews.length;
            totalSalesCents += product.orders.reduce((sum, order) => sum + order.total_price_cents, 0);
            const ratings = product.reviews
                .map((r) => r.rating)
                .filter((r) => r !== null);
            if (ratings.length > 0) {
                totalRating += ratings.reduce((sum, r) => sum + r, 0);
                ratedReviewsCount += ratings.length;
            }
        }
        const averageRating = ratedReviewsCount > 0 ? totalRating / ratedReviewsCount : 0;
        const totalUploads = products.length;
        return {
            totalLikes,
            totalReviews,
            totalSalesCents,
            totalUploads,
            averageRating,
        };
    }
    async getCreatorReviews(userId) {
        const creatorId = await this.getCreatorIdFromUserId(userId);
        const products = await this.prisma.product.findMany({
            where: { creator_id: creatorId },
            include: { reviews: true },
        });
        return products.flatMap((p) => p.reviews);
    }
    async getSalesByMonth(userId) {
        const creatorId = await this.getCreatorIdFromUserId(userId);
        const products = await this.prisma.product.findMany({
            where: { creator_id: creatorId },
            include: { orders: true },
        });
        const totals = new Map();
        for (const p of products) {
            for (const o of p.orders) {
                const d = new Date(o.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                totals.set(key, (totals.get(key) ?? 0) + o.total_price_cents);
            }
        }
        return Array.from(totals.entries()).map(([month, total_cents]) => ({
            month,
            total_cents,
        }));
    }
    async getCreatorProducts(userId) {
        const creatorId = await this.getCreatorIdFromUserId(userId);
        const products = await this.prisma.product.findMany({
            where: {
                creator_id: creatorId,
                is_deleted: false,
            },
            include: {
                stats: true,
                images: {
                    orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        return products.map((product) => {
            const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];
            const imageUrl = primaryImage?.url || null;
            let tags = [];
            try {
                if (product.description) {
                    const parsed = JSON.parse(product.description);
                    if (parsed.tags && Array.isArray(parsed.tags)) {
                        tags = parsed.tags;
                    }
                }
            }
            catch {
            }
            const triesCount = product.stats?.views || 0;
            const conversionRate = triesCount > 0
                ? ((product.stats?.likes_count || 0) / triesCount) * 100
                : 0;
            return {
                product_id: product.product_id,
                name: product.title,
                title: product.title,
                description: product.description,
                image_url: imageUrl,
                price_cents: product.price_cents,
                currency: product.currency,
                inventory_count: product.inventory_count,
                status: product.status === 'approved' ? 'Active' : 'Pending',
                tags: tags,
                stats: {
                    likes_count: product.stats?.likes_count || 0,
                    tries_count: triesCount,
                    conversion_rate: Math.round(conversionRate * 100) / 100,
                    views: product.stats?.views || 0,
                    comments_count: product.stats?.comments_count || 0,
                },
                created_at: product.created_at,
                updated_at: product.updated_at,
            };
        });
    }
    async createProduct(userId, dto) {
        const slug = `${dto.title.toLowerCase().replace(/\s+/g, '-')}-${(0, nanoid_1.nanoid)(6)}`;
        const product = await this.prisma.product.create({
            data: {
                title: dto.title,
                slug,
                description: dto.description || '',
                price_cents: dto.price_cents,
                currency: dto.currency || 'INR',
                inventory_count: dto.inventory_count || 0,
                creator_id: userId,
            },
        });
        if (dto.images && Array.isArray(dto.images)) {
            await Promise.all(dto.images.map(async (image, index) => {
                try {
                    const uploadedUrl = await this.cloudinaryService.uploadImage(image);
                    await this.prisma.productImage.create({
                        data: {
                            product_id: product.product_id,
                            url: uploadedUrl,
                            order_index: index,
                        },
                    });
                }
                catch {
                    throw new common_1.BadRequestException(`Failed to upload image`);
                }
            }));
        }
        return product;
    }
    async updateProduct(userId, productId, dto) {
        const creatorId = await this.getCreatorIdFromUserId(userId);
        const product = await this.prisma.product.findUnique({
            where: { product_id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.creator_id !== creatorId) {
            throw new common_1.ForbiddenException('You do not have permission to update this product');
        }
        if (product.is_deleted) {
            throw new common_1.BadRequestException('Cannot update a deleted product');
        }
        const updateData = {
            updated_at: new Date(),
        };
        if (dto.title) {
            updateData.title = dto.title;
            const baseSlug = this.slugify(dto.title);
            let slug = baseSlug;
            let i = 1;
            while (await this.prisma.product.findFirst({
                where: { slug, product_id: { not: productId } },
            })) {
                slug = `${baseSlug}-${i++}`;
            }
            updateData.slug = slug;
        }
        if (dto.description !== undefined) {
            updateData.description = dto.description;
        }
        if (dto.price_cents !== undefined) {
            updateData.price_cents = dto.price_cents;
        }
        if (dto.currency !== undefined) {
            updateData.currency = dto.currency;
        }
        if (dto.inventory_count !== undefined) {
            updateData.inventory_count = dto.inventory_count;
        }
        if (dto.status) {
            updateData.status = dto.status;
        }
        if (dto.tags !== undefined) {
            let description = dto.description || product.description || '';
            if (dto.tags.length > 0) {
                const metadata = {
                    tags: dto.tags,
                    ...(description && !description.startsWith('{')
                        ? { originalDescription: description }
                        : {}),
                };
                description = JSON.stringify(metadata);
            }
            updateData.description = description;
        }
        const updatedProduct = await this.prisma.product.update({
            where: { product_id: productId },
            data: updateData,
        });
        return this.getProductById(updatedProduct.product_id, creatorId);
    }
    async deleteProduct(userId, productId) {
        const creatorId = await this.getCreatorIdFromUserId(userId);
        const product = await this.prisma.product.findUnique({
            where: { product_id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.creator_id !== creatorId) {
            throw new common_1.ForbiddenException('You do not have permission to delete this product');
        }
        await this.prisma.product.update({
            where: { product_id: productId },
            data: {
                is_deleted: true,
                updated_at: new Date(),
            },
        });
        return { message: 'Product deleted successfully' };
    }
    async getProductById(productId, creatorId) {
        const product = await this.prisma.product.findFirst({
            where: {
                product_id: productId,
                creator_id: creatorId,
            },
            include: {
                stats: true,
                images: {
                    orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];
        const imageUrl = primaryImage?.url || null;
        let tags = [];
        try {
            if (product.description) {
                const parsed = JSON.parse(product.description);
                if (parsed.tags && Array.isArray(parsed.tags)) {
                    tags = parsed.tags;
                }
            }
        }
        catch {
        }
        const triesCount = product.stats?.views || 0;
        const conversionRate = triesCount > 0
            ? ((product.stats?.likes_count || 0) / triesCount) * 100
            : 0;
        return {
            product_id: product.product_id,
            name: product.title,
            title: product.title,
            description: product.description,
            image_url: imageUrl,
            price_cents: product.price_cents,
            currency: product.currency,
            inventory_count: product.inventory_count,
            status: product.status === 'approved' ? 'Active' : 'Pending',
            tags: tags,
            stats: {
                likes_count: product.stats?.likes_count || 0,
                tries_count: triesCount,
                conversion_rate: Math.round(conversionRate * 100) / 100,
                views: product.stats?.views || 0,
                comments_count: product.stats?.comments_count || 0,
            },
            created_at: product.created_at,
            updated_at: product.updated_at,
        };
    }
};
exports.CreatorDashboardService = CreatorDashboardService;
exports.CreatorDashboardService = CreatorDashboardService = CreatorDashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cloudinary_service_1.CloudinaryService])
], CreatorDashboardService);
//# sourceMappingURL=creator-dashboard.service.js.map