import { CouponStatus } from "../enums/discount-constants";

export const isCouponExpired = (endDate: Date): boolean => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    const expiry = new Date(endDate);
    expiry.setHours(0, 0, 0, 0); // Start of expiry date

    return now > expiry;
};

export const getDynamicCouponStatus = (status: string, endDate: Date): string => {
    if (status === CouponStatus.INACTIVE) {
        return CouponStatus.INACTIVE;
    }

    if (isCouponExpired(endDate)) {
        return CouponStatus.EXPIRED;
    }

    return CouponStatus.ACTIVE;
};

export default getDynamicCouponStatus;
