// OTP Configuration Constants
export const OTP_LENGTH = 4;
export const OTP_EXPIRY_MINUTES = 5;
export const MAX_OTP_ATTEMPTS = 3;
export const OTP_RATE_LIMIT_WINDOW_MINUTES = 15;
export const MAX_OTP_REQUESTS_PER_WINDOW = 3;

// OTP Messages
export const OTP_MESSAGE_TEMPLATE = (otp: string) =>
    `Your AiVestire verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
