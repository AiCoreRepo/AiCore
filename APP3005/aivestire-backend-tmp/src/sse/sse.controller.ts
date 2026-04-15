// ============================================
// SSE CONTROLLER
// ============================================
//
// GET /sse/refund-updates
//   → Opens a long-lived SSE connection for the authenticated user.
//   → Frontend connects via EventSource with auth token in query.
// ============================================

import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  Query,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SseService } from './sse.service';

@Controller('sse')
export class SseController {
  private readonly logger = new Logger(SseController.name);

  constructor(private readonly sseService: SseService) {}

  /**
   * GET /sse/refund-updates
   *
   * Opens a Server-Sent Events stream for the authenticated user.
   * The frontend should connect with:
   *   new EventSource('/sse/refund-updates?token=<jwt>')
   *
   * Headers are set for SSE compliance; connection stays open until
   * the client disconnects or the server shuts down.
   */
  @Get('refund-updates')
  @UseGuards(JwtAuthGuard)
  async subscribeRefundUpdates(
    @Req() req: Request & { user?: { user_id: string } },
    @Res() res: Response,
  ) {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    this.logger.log(`SSE connection request from user ${userId}`);

    // ── SSE Headers ──────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx compatibility
    res.flushHeaders();

    // Send initial connection confirmation
    res.write(`event: connected\ndata: ${JSON.stringify({ userId, timestamp: new Date().toISOString() })}\n\n`);

    // Register this connection
    this.sseService.addConnection(userId, res);

    // ── Keep-alive heartbeat every 30s ────────────────────────────────
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 30_000);

    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      this.logger.log(`SSE connection closed for user ${userId}`);
    });
  }

  /**
   * GET /sse/health
   * Returns active SSE connection count. No auth required.
   */
  @Get('health')
  getHealth() {
    return {
      activeConnections: this.sseService.getActiveConnectionCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
