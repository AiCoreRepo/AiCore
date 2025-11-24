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
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ApprovalsService = class ApprovalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async approve(productId, adminUserId, comment) {
        return this.prisma.$transaction(async (tx) => {
            const approval = await tx.productApproval.findFirst({
                where: { product_id: productId, status: 'pending' },
            });
            if (!approval)
                throw new common_1.NotFoundException('No pending approval found');
            await tx.productApproval.update({
                where: { approval_id: approval.approval_id },
                data: {
                    status: 'approved',
                    admin_user_id: adminUserId,
                    actioned_at: new Date(),
                    comment,
                },
            });
            await tx.product.update({
                where: { product_id: productId },
                data: { status: 'approved' },
            });
            await tx.approvalLog.create({
                data: {
                    approval_id: approval.approval_id,
                    actor_user_id: adminUserId,
                    action: 'approved',
                    comment,
                },
            });
            return { message: 'Product approved' };
        });
    }
    async reject(productId, adminUserId, comment) {
        return this.prisma.$transaction(async (tx) => {
            const approval = await tx.productApproval.findFirst({
                where: { product_id: productId, status: 'pending' },
            });
            if (!approval)
                throw new common_1.NotFoundException('No pending approval found');
            await tx.productApproval.update({
                where: { approval_id: approval.approval_id },
                data: {
                    status: 'rejected',
                    admin_user_id: adminUserId,
                    actioned_at: new Date(),
                    comment,
                },
            });
            await tx.product.update({
                where: { product_id: productId },
                data: { status: 'rejected' },
            });
            await tx.approvalLog.create({
                data: {
                    approval_id: approval.approval_id,
                    actor_user_id: adminUserId,
                    action: 'rejected',
                    comment,
                },
            });
            return { message: 'Product rejected' };
        });
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map