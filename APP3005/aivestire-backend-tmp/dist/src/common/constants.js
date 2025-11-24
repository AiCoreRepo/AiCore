"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_COOKIE_OPTIONS = exports.JWT_REFRESH_TOKEN_EXPIRES_IN = exports.JWT_ACCESS_TOKEN_EXPIRES_IN = void 0;
exports.JWT_ACCESS_TOKEN_EXPIRES_IN = '15m';
exports.JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';
exports.REFRESH_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    path: '/auth/refresh',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
//# sourceMappingURL=constants.js.map