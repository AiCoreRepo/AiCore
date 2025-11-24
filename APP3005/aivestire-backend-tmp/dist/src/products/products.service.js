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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cloudinary_service_1 = require("../common/cloudinary.service");
function slugify(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
let ProductsService = class ProductsService {
    prisma;
    cloudinaryService;
    constructor(prisma, cloudinaryService) {
        this.prisma = prisma;
        this.cloudinaryService = cloudinaryService;
    }
    async create(dto) {
        try {
            const baseSlug = dto.slug ? slugify(dto.slug) : slugify(dto.title);
            let slug = baseSlug;
            let i = 1;
            while (await this.prisma.product.findUnique({ where: { slug } })) {
                slug = `${baseSlug}-${i++}`;
            }
            const imageUrls = [];
            if (dto.images && Array.isArray(dto.images) && dto.images.length > 0) {
                for (const base64Image of dto.images) {
                    const uploadedUrl = await this.cloudinaryService.uploadImage(base64Image);
                    imageUrls.push({ url: uploadedUrl });
                }
            }
            const data = {
                title: dto.title,
                slug,
                description: dto.description,
                price_cents: dto.price_cents,
                currency: dto.currency ?? undefined,
                inventory_count: dto.inventory_count ?? undefined,
                creator: { connect: { creator_id: dto.creator_id } },
                images: {
                    create: imageUrls.map((image, index) => ({
                        url: image.url,
                        order_index: index,
                        is_primary: index === 0,
                    })),
                },
            };
            return await this.prisma.product.create({ data });
        }
        catch (e) {
            throw new common_1.BadRequestException(e instanceof Error ? e.message : 'Unknown error');
        }
    }
    async update(id, dto) {
        try {
            const updateData = {
                title: dto.title,
                description: dto.description,
                price_cents: dto.price_cents,
                currency: dto.currency,
                inventory_count: dto.inventory_count,
                slug: dto.slug,
            };
            Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);
            if (dto.images && Array.isArray(dto.images) && dto.images.length > 0) {
                await this.prisma.productImage.deleteMany({
                    where: { product_id: id },
                });
                await Promise.all(dto.images.map(async (base64Image, index) => {
                    const uploadedUrl = await this.cloudinaryService.uploadImage(base64Image);
                    await this.prisma.productImage.create({
                        data: {
                            product_id: id,
                            url: uploadedUrl,
                            order_index: index,
                            is_primary: index === 0,
                        },
                    });
                }));
            }
            return await this.prisma.product.update({
                where: { product_id: id },
                data: updateData,
            });
        }
        catch (e) {
            throw new common_1.NotFoundException('Product not found');
        }
    }
    async submitForApproval(id) {
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { product_id: id },
            });
            if (!product)
                throw new common_1.NotFoundException('Product not found');
            if (product.status !== 'draft')
                throw new common_1.BadRequestException('Only draft products can be submitted');
            await tx.product.update({
                where: { product_id: id },
                data: { status: 'pending_review' },
            });
            await tx.productApproval.create({
                data: {
                    product_id: id,
                    status: 'pending',
                },
            });
            return { message: 'Product submitted for approval' };
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cloudinary_service_1.CloudinaryService])
], ProductsService);
//# sourceMappingURL=products.service.js.map