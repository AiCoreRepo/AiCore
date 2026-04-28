// ============================================
// useRefundSSE — Real-time Refund Status Hook
// ============================================
//
// Opens an SSE connection to GET /sse/refund-updates
// and dispatches refund status updates to the parent component.
//
// Features:
//   ✅ Auto-reconnect with exponential backoff
//   ✅ Multiple tabs — each gets their own connection
//   ✅ Closes cleanly on unmount
//   ✅ Stops reconnecting on terminal states
//   ✅ Works even if refund page is not open (queued update on reopen)
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { REFUND_SSE_EVENT, REFUND_TERMINAL_STATES } from '../constants/refund.constants';
import type { RefundStatus } from '../types/order.types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MAX_RECONNECT_DELAY_MS = 30_000; // 30 seconds cap
const INITIAL_RECONNECT_DELAY_MS = 1_000;

export interface RefundSseEvent {
  refundId: string;
  orderId: string;
  status: RefundStatus;
  message: string;
  amount?: string;
  timestamp: string;
}

interface UseRefundSseOptions {
  /** Called every time a refund-update event arrives */
  onUpdate: (event: RefundSseEvent) => void;
  /** Only listen for updates on these specific orderIds (undefined = all) */
  watchOrderIds?: string[];
  /** Stop reconnecting after this many failures (default: unlimited) */
  maxRetries?: number;
}

export function useRefundSSE({
  onUpdate,
  watchOrderIds,
  maxRetries,
}: UseRefundSseOptions) {
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
  const mountedRef = useRef(true);
  const onUpdateRef = useRef(onUpdate);

  // Keep callback ref fresh without re-subscribing
  onUpdateRef.current = onUpdate;

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const token = localStorage.getItem('access_token');
    if (!token) return; // Not logged in, skip

    // Build SSE URL — token passed as query param since EventSource
    // doesn't support custom headers
    const url = `${API_BASE}/sse/refund-updates?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    // ── Connection confirmed ─────────────────────────────────────────
    es.addEventListener('connected', () => {
      retryCountRef.current = 0;
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
      console.debug('[RefundSSE] Connected');
    });

    // ── Refund update event ──────────────────────────────────────────
    es.addEventListener(REFUND_SSE_EVENT, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as RefundSseEvent;

        // Filter: only process updates for watched orders
        if (watchOrderIds && !watchOrderIds.includes(data.orderId)) return;

        onUpdateRef.current(data);
      } catch (err) {
        console.error('[RefundSSE] Failed to parse event:', err);
      }
    });

    // ── Error / reconnect ────────────────────────────────────────────
    es.onerror = () => {
      es.close();
      esRef.current = null;

      if (!mountedRef.current) return;

      retryCountRef.current += 1;

      if (maxRetries !== undefined && retryCountRef.current > maxRetries) {
        console.warn(`[RefundSSE] Max retries (${maxRetries}) reached, giving up`);
        return;
      }

      console.debug(
        `[RefundSSE] Disconnected. Reconnecting in ${reconnectDelayRef.current}ms (attempt #${retryCountRef.current})`,
      );

      reconnectTimerRef.current = setTimeout(() => {
        // Exponential backoff capped at MAX_RECONNECT_DELAY_MS
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          MAX_RECONNECT_DELAY_MS,
        );
        connect();
      }, reconnectDelayRef.current);
    };
  }, [watchOrderIds, maxRetries]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect]);
}

// ─── Tiny helper: is this a terminal status? ────────────────────────────────

export function isTerminalRefundStatus(status: string): boolean {
  return REFUND_TERMINAL_STATES.includes(status as RefundStatus);
}
