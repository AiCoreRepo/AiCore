import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class AdminGoogleStrategy extends PassportStrategy(
    Strategy,
    'google-admin',
) {
    constructor() {
        const isProd = process.env.NODE_ENV === 'production';
        const defaultCallback = isProd
            ? 'https://api.aivestire.com/auth/google/admin/callback'
            : 'http://localhost:3000/auth/google/admin/callback';

        const callbackUrl = process.env.ADMIN_GOOGLE_CALLBACK_URL ||
            (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/auth/google/admin/callback` : defaultCallback);

        super({
            clientID: process.env.ADMIN_GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.ADMIN_GOOGLE_CLIENT_SECRET || '',
            callbackURL: callbackUrl,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: { emails?: { value: string }[] },
        done: VerifyCallback,
    ): Promise<void> {
        const email = profile.emails?.[0]?.value;

        if (!email) {
            return done(
                new UnauthorizedException('No email found in Google profile'),
                false,
            );
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        if (email !== adminEmail) {
            return done(
                new UnauthorizedException('Access denied. Not an admin email.'),
                false,
            );
        }

        // Pass only the email to the request
        done(null, { email });
    }
}
