// ============================================
// COUPON SCOPE SERVICE
// ============================================

import {
    Injectable,
    BadRequestException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { CouponScopeRepository } from './coupon-scope.repository';
import { CreateCouponScopeDto } from './dto/create-coupon-scope.dto';
import { UpdateCouponScopeDto } from './dto/update-coupon-scope.dto';
import { CouponScopeType } from './enums/scope-type.enum';
import { FESTIVALS, FESTIVAL_KEYS, isValidFestivalKey } from './constants/festival.constants';
import { CouponScopeType as PrismaScopeType } from '@prisma/client';

@Injectable()
export class CouponScopeService {
    private readonly logger = new Logger(CouponScopeService.name);

    constructor(private readonly scopeRepo: CouponScopeRepository) { }

    /**
     * Get hardcoded festival list (for admin dropdown)
     */
    getFestivalList() {
        return FESTIVALS;
    }

    /**
     * Get scope for a coupon
     */
    async getScopeByCouponId(couponId: string) {
        const scope = await this.scopeRepo.findByCouponId(couponId);
        if (!scope) return null;

        return this.transformScope(scope);
    }

    /**
     * Create or update scope for a coupon
     */
    async upsertScope(couponId: string, dto: CreateCouponScopeDto) {
        this.validateScopeDto(dto);

        const scope = await this.scopeRepo.upsertByCouponId(couponId, {
            scopeType: dto.scopeType as unknown as PrismaScopeType,
            minPrice: dto.scopeType === CouponScopeType.PRICE_LEVEL ? dto.minPrice : undefined,
            maxPrice: dto.scopeType === CouponScopeType.PRICE_LEVEL ? dto.maxPrice : undefined,
            festivalKey: dto.scopeType === CouponScopeType.FESTIVAL ? dto.festivalKey : undefined,
            companyAnniversaryDate: dto.scopeType === CouponScopeType.COMPANY_ANNIVERSARY ? dto.companyAnniversaryDate : undefined,
        });

        this.logger.log(`Scope upserted for coupon ${couponId}: ${dto.scopeType}`);
        return this.transformScope(scope);
    }

    /**
     * Delete scope for a coupon
     */
    async deleteScope(couponId: string) {
        const exists = await this.scopeRepo.existsByCouponId(couponId);
        if (!exists) {
            throw new NotFoundException('No scope found for this coupon');
        }

        await this.scopeRepo.deleteByCouponId(couponId);
        this.logger.log(`Scope deleted for coupon ${couponId}`);
        return { message: 'Scope deleted successfully' };
    }

    // ─── Validation ────────────────────────────────────

    private validateScopeDto(dto: CreateCouponScopeDto) {
        switch (dto.scopeType) {
            case CouponScopeType.PRICE_LEVEL:
                this.validatePriceLevelScope(dto.minPrice, dto.maxPrice);
                break;

            case CouponScopeType.FESTIVAL:
                this.validateFestivalScope(dto.festivalKey);
                break;

            case CouponScopeType.COMPANY_ANNIVERSARY:
                if (!dto.companyAnniversaryDate) {
                    throw new BadRequestException('Company anniversary date is required for Company Anniversary scope');
                }
                const dateNum = Date.parse(dto.companyAnniversaryDate);
                if (isNaN(dateNum)) {
                    throw new BadRequestException('Invalid company anniversary date format');
                }
                break;

            case CouponScopeType.USER:
            case CouponScopeType.COLLECTION:
            case CouponScopeType.COMPANY_SPECIAL:
                throw new BadRequestException(
                    `Scope type "${dto.scopeType}" is not implemented yet. Please use GLOBAL, PRICE_LEVEL, FESTIVAL, USER_BIRTHDAY, or COMPANY_ANNIVERSARY.`,
                );

            case CouponScopeType.GLOBAL:
            case CouponScopeType.USER_BIRTHDAY:
                // No additional validation needed
                break;

            default:
                throw new BadRequestException(`Unknown scope type: ${dto.scopeType}`);
        }
    }

    private validatePriceLevelScope(minPrice?: number, maxPrice?: number) {
        if (minPrice === undefined || minPrice === null) {
            throw new BadRequestException('Min price is required for Price Level scope');
        }
        if (maxPrice === undefined || maxPrice === null) {
            throw new BadRequestException('Max price is required for Price Level scope');
        }
        if (minPrice < 0) {
            throw new BadRequestException('Min price cannot be negative');
        }
        if (maxPrice <= 0) {
            throw new BadRequestException('Max price must be greater than 0');
        }
        if (minPrice >= maxPrice) {
            throw new BadRequestException('Min price must be less than max price');
        }
    }

    private validateFestivalScope(festivalKey?: string) {
        if (!festivalKey) {
            throw new BadRequestException('Festival key is required for Festival scope');
        }
        if (!isValidFestivalKey(festivalKey)) {
            throw new BadRequestException(
                `Invalid festival key "${festivalKey}". Valid keys: ${FESTIVAL_KEYS.join(', ')}`,
            );
        }
    }

    // ─── Transform ─────────────────────────────────────

    private transformScope(scope: any) {
        return {
            scopeId: scope.scope_id,
            couponId: scope.coupon_id,
            scopeType: scope.scope_type,
            minPrice: scope.min_price ? Number(scope.min_price) : null,
            maxPrice: scope.max_price ? Number(scope.max_price) : null,
            festivalKey: scope.festival_key,
            companyAnniversaryDate: scope.company_anniversary_date ? scope.company_anniversary_date.toISOString() : null,
            createdAt: scope.created_at?.toISOString(),
            updatedAt: scope.updated_at?.toISOString(),
        };
    }
}
