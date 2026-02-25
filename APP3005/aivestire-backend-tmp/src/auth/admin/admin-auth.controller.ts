import {
    Controller,
    Get,
    Post,
    Body,
    Req,
    Res,
    UseGuards,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';

@Controller('auth/google/admin')
export class AdminAuthController {
    constructor(private readonly adminAuthService: AdminAuthService) { }

    /**
     * GET /auth/google/admin
     * Initiates admin Google OAuth login
     */
    @Get()
    @UseGuards(AuthGuard('google-admin'))
    async googleAdminLogin() {
        // Passport redirects to Google — this body never executes
    }

    /**
     * GET /auth/google/admin/callback
     * Google OAuth callback — validates admin email, redirects to secret confirm page
     */
    @Get('callback')
    @UseGuards(AuthGuard('google-admin'))
    async googleAdminCallback(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const user = req.user as { email: string } | undefined;

        if (!user || !user.email) {
            throw new UnauthorizedException('Authentication failed');
        }

        // Admin email was already validated in the strategy
        // Redirect to frontend secret confirmation page
        const isProd = process.env.NODE_ENV === 'production';
        const frontendUrl = process.env.FRONTEND_URL || (isProd ? 'https://aivestire.com' : 'http://localhost:8080');
        res.redirect(
            `${frontendUrl}/admin-secret-confirm?email=${encodeURIComponent(user.email)}`,
        );
    }

    /**
     * POST /auth/google/admin/verify-secret
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
