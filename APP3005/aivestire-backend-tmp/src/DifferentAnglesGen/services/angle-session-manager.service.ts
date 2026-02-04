import { Injectable, Logger } from '@nestjs/common';
import { AngleType } from '../enums/angle.enum';
import { ANGLE_SEQUENCE, INITIAL_SESSION_INDEX } from '../constants/angle.constants';

/**
 * Service to manage angle generation sessions per user+product
 * Tracks which angle should be generated next in the sequence
 */
@Injectable()
export class AngleSessionManagerService {
    private readonly logger = new Logger(AngleSessionManagerService.name);

    /**
     * In-memory storage for session tracking
     * Format: { sessionKey: currentIndex }
     */
    private sessions: Map<string, number> = new Map();

    /**
     * Generate session key from user ID and product ID
     */
    private getSessionKey(userId: string, productId: string): string {
        return `${userId}_${productId}`;
    }

    /**
     * Get the next angle in sequence for a specific session
     * @returns Tuple of [angle, currentIndex]
     */
    getNextAngle(userId: string, productId: string): [AngleType, number] {
        const sessionKey = this.getSessionKey(userId, productId);

        // Get current index for this session (default to INITIAL_SESSION_INDEX if new)
        const idx = this.sessions.get(sessionKey) ?? INITIAL_SESSION_INDEX;

        // Get the angle at this index (with wraparound)
        const angle = ANGLE_SEQUENCE[idx % ANGLE_SEQUENCE.length];

        // Increment the index for next time
        this.sessions.set(sessionKey, idx + 1);

        this.logger.log(
            `📐 Session ${sessionKey}: Generated angle '${angle}' at index ${idx}`,
        );

        return [angle, idx];
    }

    /**
     * Reset a session to start from the beginning
     * Sets index to INITIAL_SESSION_INDEX (skipping FRONT which is already from try-on)
     */
    resetSession(userId: string, productId: string): void {
        const sessionKey = this.getSessionKey(userId, productId);
        this.sessions.set(sessionKey, INITIAL_SESSION_INDEX);

        this.logger.log(
            `🔄 Session ${sessionKey}: Reset to index ${INITIAL_SESSION_INDEX} (angle: ${ANGLE_SEQUENCE[INITIAL_SESSION_INDEX]})`,
        );
    }


    getCurrentIndex(userId: string, productId: string): number {
        const sessionKey = this.getSessionKey(userId, productId);
        return this.sessions.get(sessionKey) ?? INITIAL_SESSION_INDEX;
    }


    clearAllSessions(): void {
        const count = this.sessions.size;
        this.sessions.clear();
        this.logger.log(`🗑️ Cleared ${count} angle sessions`);
    }
}
