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
exports.ApprovalsController = void 0;
const common_1 = require("@nestjs/common");
const approvals_service_1 = require("./approvals.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let ApprovalsController = class ApprovalsController {
    approvalsService;
    constructor(approvalsService) {
        this.approvalsService = approvalsService;
    }
    approve(productId, admin, comment) {
        return this.approvalsService.approve(productId, admin.user_id, comment);
    }
    reject(productId, admin, comment) {
        return this.approvalsService.reject(productId, admin.user_id, comment);
    }
};
exports.ApprovalsController = ApprovalsController;
__decorate([
    (0, common_1.Post)(':productId/approve'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':productId/reject'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "reject", null);
exports.ApprovalsController = ApprovalsController = __decorate([
    (0, common_1.Controller)('approvals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [approvals_service_1.ApprovalsService])
], ApprovalsController);
//# sourceMappingURL=approvals.controller.js.map