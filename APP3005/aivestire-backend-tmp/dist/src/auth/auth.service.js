"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jwt_1 = require("@nestjs/jwt");
function isBcryptModule(mod) {
    return (typeof mod === 'object' && mod !== null && 'hash' in mod && 'compare' in mod);
}
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
const constants_1 = require("../common/constants");
let bcryptPromise = null;
function getBcrypt() {
    if (!bcryptPromise) {
        bcryptPromise = import('bcrypt');
    }
    return bcryptPromise;
}
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    slugify(input) {
        return input
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    async register(dto) {
        const exists = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (exists) {
            throw new common_1.BadRequestException('Email already registered');
        }
        const bcryptMod1 = await getBcrypt();
        if (!isBcryptModule(bcryptMod1)) {
            throw new Error('Failed to load bcrypt module');
        }
        const password_hash = await bcryptMod1.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password_hash,
                role: dto.role,
                is_creator: dto.role === 'creator' ? true : false,
            },
        });
        if (user.role === 'creator') {
            const storeName = `${user.email.split('@')[0]} Store`;
            let storeSlug = this.slugify(storeName);
            let i = 1;
            while (await this.prisma.creator.findUnique({
                where: { store_slug: storeSlug },
            })) {
                storeSlug = `${this.slugify(storeName)}-${i++}`;
            }
            await this.prisma.creator.create({
                data: {
                    user_id: user.user_id,
                    store_name: storeName,
                    store_slug: storeSlug,
                    verified: true,
                    verification_data: {
                        autoCreated: true,
                        timestamp: new Date().toISOString(),
                    },
                },
            });
        }
        return {
            user_id: user.user_id,
            email: user.email,
            role: user.role,
        };
    }
    async validateUser(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.password_hash)
            return null;
        const bcryptMod2 = await getBcrypt();
        if (!isBcryptModule(bcryptMod2)) {
            throw new Error('Failed to load bcrypt module');
        }
        const valid = await bcryptMod2.compare(password, user.password_hash);
        return valid ? user : null;
    }
    async login(dto, res) {
        const user = await this.validateUser(dto.email, dto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.issueTokens(user.user_id, user.role);
        const bcryptMod3 = await getBcrypt();
        if (!isBcryptModule(bcryptMod3)) {
            throw new Error('Failed to load bcrypt module');
        }
        const refresh_token_hash = await bcryptMod3.hash(tokens.refresh_token, 10);
        await this.prisma.user.update({
            where: { user_id: user.user_id },
            data: { refresh_token_hash },
        });
        res.cookie('refresh_token', tokens.refresh_token, constants_1.REFRESH_TOKEN_COOKIE_OPTIONS);
        return {
            access_token: tokens.access_token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
            },
        };
    }
    async refresh(user_id, refresh_token, res) {
        const user = await this.prisma.user.findUnique({ where: { user_id } });
        if (!user || !user.refresh_token_hash) {
            throw new common_1.UnauthorizedException();
        }
        const bcryptMod4 = await getBcrypt();
        if (!isBcryptModule(bcryptMod4)) {
            throw new Error('Failed to load bcrypt module');
        }
        const valid = await bcryptMod4.compare(refresh_token, user.refresh_token_hash);
        if (!valid) {
            throw new common_1.ForbiddenException('Invalid refresh token');
        }
        const tokens = await this.issueTokens(user.user_id, user.role);
        const bcryptMod5 = await getBcrypt();
        if (!isBcryptModule(bcryptMod5)) {
            throw new Error('Failed to load bcrypt module');
        }
        const refresh_token_hash = await bcryptMod5.hash(tokens.refresh_token, 10);
        await this.prisma.user.update({
            where: { user_id: user.user_id },
            data: { refresh_token_hash },
        });
        res.cookie('refresh_token', tokens.refresh_token, constants_1.REFRESH_TOKEN_COOKIE_OPTIONS);
        return {
            access_token: tokens.access_token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
            },
        };
    }
    async logout(user_id, res) {
        await this.prisma.user.update({
            where: { user_id },
            data: { refresh_token_hash: null },
        });
        res.clearCookie('refresh_token', constants_1.REFRESH_TOKEN_COOKIE_OPTIONS);
        return { message: 'Logged out' };
    }
    async getProfile(user_id) {
        const user = await this.prisma.user.findUnique({
            where: { user_id },
            include: {
                creatorProfile: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.role === 'creator' && user.creatorProfile) {
            return {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                store_name: user.creatorProfile.store_name,
            };
        }
        return {
            user_id: user.user_id,
            email: user.email,
            role: user.role,
        };
    }
    async issueTokens(user_id, role) {
        const payload = { sub: user_id, role };
        let access_token;
        try {
            access_token = await this.jwtService.signAsync(payload, {
                expiresIn: constants_1.JWT_ACCESS_TOKEN_EXPIRES_IN,
            });
        }
        catch {
            throw new common_1.BadRequestException('JWT signing failed');
        }
        const refresh_token = crypto.randomBytes(64).toString('hex');
        return { access_token, refresh_token };
    }
    async simpleCreatorLogin(email, res) {
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    role: 'creator',
                    is_creator: true,
                    status: 'active',
                },
            });
            await this.prisma.creator.create({
                data: {
                    user_id: user.user_id,
                    store_name: `${email.split('@')[0]}'s Store`,
                    store_slug: this.slugify(`${email.split('@')[0]}-store`),
                    verified: true,
                },
            });
        }
        else if (user.role !== 'creator') {
            user = await this.prisma.user.update({
                where: { user_id: user.user_id },
                data: { role: 'creator', is_creator: true },
            });
            const creatorProfile = await this.prisma.creator.findUnique({
                where: { user_id: user.user_id },
            });
            if (!creatorProfile) {
                await this.prisma.creator.create({
                    data: {
                        user_id: user.user_id,
                        store_name: `${email.split('@')[0]}'s Store`,
                        store_slug: this.slugify(`${email.split('@')[0]}-store`),
                        verified: true,
                    },
                });
            }
        }
        const tokens = await this.issueTokens(user.user_id, 'creator');
        const bcryptMod = await getBcrypt();
        if (!isBcryptModule(bcryptMod)) {
            throw new Error('Failed to load bcrypt module');
        }
        const refresh_token_hash = await bcryptMod.hash(tokens.refresh_token, 10);
        await this.prisma.user.update({
            where: { user_id: user.user_id },
            data: { refresh_token_hash },
        });
        res.cookie('refresh_token', tokens.refresh_token, constants_1.REFRESH_TOKEN_COOKIE_OPTIONS);
        return {
            access_token: tokens.access_token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: 'creator',
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map