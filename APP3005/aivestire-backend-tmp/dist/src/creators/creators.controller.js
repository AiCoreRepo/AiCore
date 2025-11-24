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
exports.CreatorsController = void 0;
const common_1 = require("@nestjs/common");
const creators_service_1 = require("./creators.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CreatorsController = class CreatorsController {
    creatorsService;
    constructor(creatorsService) {
        this.creatorsService = creatorsService;
    }
    async verify(creatorId, admin, verification_data) {
        return this.creatorsService.verifyCreator(creatorId, admin.user_id, verification_data);
    }
};
exports.CreatorsController = CreatorsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)(':creatorId/verify'),
    __param(0, (0, common_1.Param)('creatorId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CreatorsController.prototype, "verify", null);
exports.CreatorsController = CreatorsController = __decorate([
    (0, common_1.Controller)('creators'),
    __metadata("design:paramtypes", [creators_service_1.CreatorsService])
], CreatorsController);
//# sourceMappingURL=creators.controller.js.map