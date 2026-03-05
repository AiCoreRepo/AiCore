import { CouponScopeType } from '@prisma/client';

export function checkSpecialCouponEligibility(
    scopeType: CouponScopeType | undefined,
    companyAnniversaryDate: Date | null | undefined,
    userDob: Date | null | undefined
): boolean {
    if (!scopeType) return true;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    if (scopeType === 'USER_BIRTHDAY') {
        if (!userDob) return false;
        return userDob.getMonth() === currentMonth && userDob.getDate() === currentDate;
    }

    if (scopeType === 'COMPANY_ANNIVERSARY') {
        if (!companyAnniversaryDate) return false;
        const anniv = new Date(companyAnniversaryDate);
        return anniv.getMonth() === currentMonth && anniv.getDate() === currentDate;
    }

    // Other scopes (GLOBAL, PRICE_LEVEL, FESTIVAL, etc.) are eligible by default here
    return true;
}
