// ============================================
// SSE (SERVER-SENT EVENTS) SERVICE
// ============================================
//
// Maintains a Map of userId → active SSE Response objects.
// Other services call `pushRefundUpdate()` to relay
// refund status changes to the connected client in real-time.
//
// Important:
//   • This service NEVER touches the database.
//   • It is a pure notification channel.
//   • Multiple tabs from the same user are supported (array of responses).
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import type { Response } from 'express';

export interface RefundSsePayload {
  refundId: string;
  orderId: string;
  status: string;
  message: string;
  amount?: string;
  timestamp: string;
}

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);

  /**
   * userId → array of active SSE Response objects.
   * One user may have multiple tabs open.
   */
  private readonly connections = new Map<string, Response[]>();

  // ─── Connection Management ──────────────────────────────────────────────

  /**
   * Register a new SSE connection for a user.
   */
  addConnection(userId: string, res: Response): void {
    const existing = this.connections.get(userId) ?? [];
    existing.push(res);
    this.connections.set(userId, existing);

    this.logger.log(
      `SSE connection added for user ${userId} (total: ${existing.length})`,
    );

    // Clean up on disconnect
    res.on('close', () => {
      this.removeConnection(userId, res);
    });
  }

  /**
   * Remove a specific SSE connection.
   */
  private removeConnection(userId: string, res: Response): void {
    const arr = this.connections.get(userId);
    if (!arr) return;

    const filtered = arr.filter((r) => r !== res);
    if (filtered.length === 0) {
      this.connections.delete(userId);
    } else {
      this.connections.set(userId, filtered);
    }

    this.logger.log(
      `SSE connection removed for user ${userId} (remaining: ${filtered.length})`,
    );
  }

  /**
   * Get active connection count (for health/debug).
   */
  getActiveConnectionCount(): number {
    let count = 0;
    for (const arr of this.connections.values()) {
      count += arr.length;
    }
    return count;
  }

  // ─── Push Events ────────────────────────────────────────────────────────

  /**
   * Push a refund status update to all active connections for a given user.
   */
  pushRefundUpdate(userId: string, payload: RefundSsePayload): void {
    const connections = this.connections.get(userId);
    if (!connections || connections.length === 0) {
      this.logger.debug(
        `No active SSE connections for user ${userId}, skipping push`,
      );
      return;
    }

    const eventData = `event: refund-update\ndata: ${JSON.stringify(payload)}\n\n`;

    let sent = 0;
    for (const res of connections) {
      try {
        res.write(eventData);
        sent++;
      } catch (err) {
        this.logger.warn(`Failed to write SSE to user ${userId}: ${err}`);
      }
    }

    this.logger.log(
      `SSE refund-update pushed to ${sent}/${connections.length} connections for user ${userId}`,
    );
  }

  /**
   * Push a generic event to a user (extensible for future use).
   */
  pushEvent(userId: string, eventName: string, data: Record<string, unknown>): void {
    const connections = this.connections.get(userId);
    if (!connections || connections.length === 0) return;

    const eventData = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const res of connections) {
      try {
        res.write(eventData);
      } catch {
        // Connection dead — will be cleaned up on 'close'
      }
    }
  }
}
