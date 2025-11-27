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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorDashboardController = void 0;
const common_1 = require("@nestjs/common");
const creator_dashboard_service_1 = require("./creator-dashboard.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
let CreatorDashboardController = class CreatorDashboardController {
    creatorDashboardService;
    constructor(creatorDashboardService) {
        this.creatorDashboardService = creatorDashboardService;
    }
    async getDashboardMetrics(user) {
        return await this.creatorDashboardService.getCreatorDashboardMetrics(user.user_id);
    }
    async getProducts(user) {
        return await this.creatorDashboardService.getCreatorProducts(user.user_id);
    }
    async createProduct(user, dto) {
        return await this.creatorDashboardService.createProduct(user.user_id, dto);
    }
    async updateProduct(user, productId, dto) {
        return await this.creatorDashboardService.updateProduct(user.user_id, productId, dto);
    }
    async deleteProduct(user, productId) {
        return await this.creatorDashboardService.deleteProduct(user.user_id, productId);
    }
};
exports.CreatorDashboardController = CreatorDashboardController;
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreatorDashboardController.prototype, "getDashboardMetrics", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreatorDashboardController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Post)('products'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", Promise)
], CreatorDashboardController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)('products/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", Promise)
], CreatorDashboardController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)('products/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CreatorDashboardController.prototype, "deleteProduct", null);
exports.CreatorDashboardController = CreatorDashboardController = __decorate([
    (0, common_1.Controller)('creator-dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('creator'),
    __metadata("design:paramtypes", [creator_dashboard_service_1.CreatorDashboardService])
], CreatorDashboardController);
//# sourceMappingURL=creator-dashboard.controller.js.map