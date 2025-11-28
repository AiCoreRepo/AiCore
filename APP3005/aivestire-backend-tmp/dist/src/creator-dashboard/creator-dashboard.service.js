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
            const user = await this.prisma.user.findUnique({
                where: { user_id: userId },
                select: { email: true, role: true, is_creator: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            if (user.role !== 'creator') {
                throw new common_1.ForbiddenException('User is not a creator');
            }
            if (user.role === 'creator' && !user.is_creator) {
                await this.prisma.user.update({
                    where: { user_id: userId },
                    data: { is_creator: true },
                });
                this.logger.log(`Updated user ${userId} is_creator to true.`);
            }
            throw new common_1.NotFoundException('Creator profile not found for this user. Please ensure your creator profile is set up.');
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
            },
        });
        let totalLikes = 0;
        const totalUploads = products.length;
        for (const product of products) {
            if (product.stats) {
                totalLikes += product.stats.likes_count;
            }
        }
        return {
            totalLikes,
            totalUploads,
        };
    }
    async getCreatorProducts(userId, page = 1, limit = 10) {
        const creatorId = await this.getCreatorIdFromUserId(userId);
        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
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
                skip,
                take: Number(limit),
            }),
            this.prisma.product.count({
                where: {
                    creator_id: creatorId,
                    is_deleted: false,
                },
            }),
        ]);
        const mappedProducts = products.map((product) => {
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
                images: product.images.map(img => img.url),
                price_cents: product.price_cents,
                currency: product.currency,
                inventory_count: product.inventory_count,
                status: product.status?.toLowerCase() === 'approved' ? 'Active' : 'Pending',
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
        return {
            data: mappedProducts,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async createProduct(userId, dto) {
        const creatorId = await this.getCreatorIdFromUserId(userId);
        const slug = `${dto.title.toLowerCase().replace(/\s+/g, '-')}-${(0, nanoid_1.nanoid)(6)}`;
        const product = await this.prisma.product.create({
            data: {
                title: dto.title,
                slug,
                description: dto.description || '',
                price_cents: dto.price_cents,
                currency: dto.currency || 'INR',
                inventory_count: dto.inventory_count || 0,
                creator_id: creatorId,
            },
        });
        if (dto.images && Array.isArray(dto.images)) {
            this.logger.log(`Received ${dto.images.length} images for product ${product.product_id}`);
            await Promise.all(dto.images.map(async (image, index) => {
                try {
                    const formattedImage = image.startsWith('data:')
                        ? image
                        : `data:image/jpeg;base64,${image}`;
                    this.logger.log(`Uploading image ${index + 1}/${dto.images?.length || 0} for product ${product.product_id}`);
                    const uploadedUrl = await this.cloudinaryService.uploadImage(formattedImage);
                    this.logger.log(`Image uploaded successfully: ${uploadedUrl}`);
                    await this.prisma.productImage.create({
                        data: {
                            product_id: product.product_id,
                            url: uploadedUrl,
                            order_index: index,
                        },
                    });
                    this.logger.log(`Product image record created for ${uploadedUrl}`);
                }
                catch (error) {
                    this.logger.error(`Failed to upload image ${index}: ${error.message}`, error.stack);
                    throw new common_1.BadRequestException(`Failed to upload image`);
                }
            }));
        }
        else {
            this.logger.warn(`No images received for product ${product.product_id}`);
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
        if (dto.images && Array.isArray(dto.images)) {
            this.logger.log(`Updating images for product ${productId}. Received ${dto.images.length} images.`);
            await this.prisma.productImage.deleteMany({
                where: { product_id: productId },
            });
            await Promise.all(dto.images.map(async (image, index) => {
                try {
                    let imageUrl = image;
                    if (image.startsWith('data:')) {
                        this.logger.log(`Uploading new image ${index + 1}/${dto.images?.length} for product ${productId}`);
                        imageUrl = await this.cloudinaryService.uploadImage(image);
                    }
                    await this.prisma.productImage.create({
                        data: {
                            product_id: productId,
                            url: imageUrl,
                            order_index: index,
                        },
                    });
                }
                catch (error) {
                    this.logger.error(`Failed to process image ${index} during update: ${error.message}`, error.stack);
                }
            }));
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
    async updateCreatorProfile(userId, dto) {
        const creatorId = await this.getCreatorIdFromUserId(userId);
        const creator = await this.prisma.creator.findUnique({
            where: { creator_id: creatorId },
        });
        if (!creator) {
            throw new common_1.NotFoundException('Creator profile not found');
        }
        let avatarUrl = dto.avatar;
        if (dto.avatar && dto.avatar.startsWith('data:')) {
            this.logger.log(`Uploading avatar for creator ${creatorId}`);
            try {
                avatarUrl = await this.cloudinaryService.uploadImage(dto.avatar);
            }
            catch (error) {
                this.logger.error(`Failed to upload avatar: ${error.message}`);
                throw new common_1.BadRequestException('Failed to upload avatar');
            }
        }
        const currentVerificationData = creator.verification_data || {};
        const newVerificationData = {
            ...currentVerificationData,
            ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
            ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {}),
        };
        const updateData = {
            ...(dto.name ? { store_name: dto.name } : {}),
            verification_data: newVerificationData,
        };
        const updatedCreator = await this.prisma.creator.update({
            where: { creator_id: creatorId },
            data: updateData,
        });
        return {
            name: updatedCreator.store_name,
            subtitle: newVerificationData.subtitle,
            avatar: newVerificationData.avatar,
        };
    }
    async getCreatorProfile(userId) {
        const creatorId = await this.getCreatorIdFromUserId(userId);
        const creator = await this.prisma.creator.findUnique({
            where: { creator_id: creatorId },
            include: { user: true },
        });
        if (!creator) {
            throw new common_1.NotFoundException('Creator profile not found');
        }
        const verificationData = creator.verification_data || {};
        return {
            name: creator.store_name,
            subtitle: verificationData.subtitle || creator.about || 'Creator',
            avatar: verificationData.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
            role: creator.user.role,
        };
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