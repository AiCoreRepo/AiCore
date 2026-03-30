import {
    Controller,
    Post,
    Body,
    Res,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AdminAuthService } from './admin-auth.service';

@Controller(['auth/google/admin', 'auth/admin'])
export class AdminAuthController {
    constructor(private readonly adminAuthService: AdminAuthService) { }

    /**
     * POST /auth/admin/verify-secret
     * Also available at POST /auth/google/admin/verify-secret for backward compatibility.
     * Verifies admin secret and issues admin JWT cookie
     */
    @Post('verify-secret')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 3 } })
    async verifySecret(
        @Body() body: { email: string; secret: string },
        @Res({ passthrough: true }) res: Response,
    ) {
        const { email, secret } = body;

        const { token } = await this.adminAuthService.verifySecretAndIssueToken(
            email,
            secret,
        );

        // Set httpOnly cookie
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 60 * 1000, // 30 minutes
            path: '/',
        });

        return {
            message: 'Admin authenticated successfully',
            redirect: '/admin-dashboard',
        };
    }
}
