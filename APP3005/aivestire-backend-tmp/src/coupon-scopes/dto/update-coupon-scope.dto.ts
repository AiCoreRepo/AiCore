// ============================================
// UPDATE COUPON SCOPE DTO
// ============================================

import { PartialType } from '@nestjs/swagger';
import { CreateCouponScopeDto } from './create-coupon-scope.dto';

export class UpdateCouponScopeDto extends PartialType(CreateCouponScopeDto) { }
