// Password Reset Configuration
export const RESET_TOKEN_BYTES = 32; // 32 bytes = 64 hex chars
export const RESET_TOKEN_EXPIRY_MINUTES = 15; // Token valid for 15 minutes

// Rate Limiting
export const RESET_RATE_LIMIT_WINDOW_MINUTES = 60; // 1-hour window
export const MAX_RESET_REQUESTS_PER_WINDOW = 3; // Max 3 requests per hour per email
