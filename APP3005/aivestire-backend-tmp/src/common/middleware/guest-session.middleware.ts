import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Guest Session Middleware
 * 
 * Issues a guest_session_id cookie if not present.
 * This enables cart functionality for unauthenticated users.
 * 
 * Key rules per enterprise cart spec:
 * - Guest identity tied to cookie (not localStorage)
 * - Session-based isolation
 * - Expires after inactivity
 */
@Injectable()
export class GuestSessionMiddleware implements NestMiddleware {
    private readonly COOKIE_NAME = 'guest_session_id';
    private readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

    use(req: Request, res: Response, next: NextFunction) {
        let sessionId = req.cookies?.[this.COOKIE_NAME];

        if (!sessionId) {
            sessionId = uuidv4();
            res.cookie(this.COOKIE_NAME, sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: this.COOKIE_MAX_AGE,
            });
        }

        // Attach session ID to request for downstream use
        (req as any).guestSessionId = sessionId;
        next();
    }
}

/**
 * Helper to extract guest session ID from request
 */
export function getGuestSessionId(req: Request): string | null {
    return (req as any).guestSessionId || req.cookies?.guest_session_id || null;
}
