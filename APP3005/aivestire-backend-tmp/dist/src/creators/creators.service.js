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
exports.CreatorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CreatorsService = class CreatorsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async verifyCreator(creator_id, admin_user_id, verification_data) {
        const jsonData = typeof verification_data === 'object' && verification_data !== null
            ? verification_data
            : {
                verifiedBy: admin_user_id,
                verifiedAt: new Date().toISOString(),
            };
        return this.prisma.creator.update({
            where: { creator_id },
            data: {
                verified: true,
                verification_data: jsonData,
            },
        });
    }
};
exports.CreatorsService = CreatorsService;
exports.CreatorsService = CreatorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreatorsService);
//# sourceMappingURL=creators.service.js.map