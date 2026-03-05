// ============================================
// COUPON ENUMS
// ============================================

export enum CouponTypeEnum {
    FLAT = 'FLAT',
    PERCENTAGE = 'PERCENTAGE',
    DELIVERY = 'DELIVERY',
}

export enum CouponStatusEnum {
    ACTIVE = 'ACTIVE',
    DISABLED = 'DISABLED',
    EXPIRED = 'EXPIRED',
}

export enum CouponScopeTypeEnum {
    GLOBAL = 'GLOBAL',
    PRICE_LEVEL = 'PRICE_LEVEL',
    FESTIVAL = 'FESTIVAL',
    USER = 'USER',
    COMPANY_SPECIAL = 'COMPANY_SPECIAL',
    COLLECTION = 'COLLECTION',
    USER_BIRTHDAY = 'USER_BIRTHDAY',
    COMPANY_ANNIVERSARY = 'COMPANY_ANNIVERSARY'
}
