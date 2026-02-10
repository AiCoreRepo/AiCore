import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface TrackingData {
    sessionId: string;
    page: string;
    url: string;
    referrer: string;
    timeSpent: number;
    userAgent: string;
    timestamp: string;
}

// Use same-origin proxy to avoid CORS. Override via VITE_TRACKING_URL if needed.
const TRACKING_ENDPOINT = import.meta.env.VITE_TRACKING_URL ?? '/n8n/track-visit';
const TRACKING_DELAY = 5000; // 5 seconds
const DEDUPLICATION_WINDOW = 3000; // 3 seconds to prevent duplicate tracking

// ✅ Fix #7: Generate or retrieve session ID
const getSessionId = (): string => {
    const SESSION_KEY = 'aivestire_session_id';
    let sessionId = localStorage.getItem(SESSION_KEY);

    if (!sessionId) {
        // Generate unique session ID
        sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(SESSION_KEY, sessionId);
    }

    return sessionId;
};

// ✅ Fix #8: Check tracking consent (optional but recommended)
const hasTrackingConsent = (): boolean => {
    // If no consent key exists, assume consent (you can change this to opt-in)
    const consent = localStorage.getItem('tracking_consent');
    return consent !== 'false'; // Allow tracking unless explicitly disabled
};

export const useActivityTracking = () => {
    const location = useLocation();
    const startTimeRef = useRef<number>(Date.now());
    // ✅ Fix #2: Browser-safe timeout type
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // ✅ Fix #6: Track last sent path for deduplication
    const lastTrackedPathRef = useRef<string>('');
    const lastTrackedTimeRef = useRef<number>(0);

    useEffect(() => {
        // ✅ Fix #4: Skip tracking in development (optional - remove if you want to test in dev)
        // Uncomment the next line to disable tracking in development:
        // if (import.meta.env.DEV) return;

        // ✅ Fix #8: Check consent before tracking
        if (!hasTrackingConsent()) {
            return;
        }

        // ✅ Fix #6: Prevent duplicate tracking for rapid route changes
        const now = Date.now();
        if (
            lastTrackedPathRef.current === location.pathname &&
            now - lastTrackedTimeRef.current < DEDUPLICATION_WINDOW
        ) {
            return;
        }

        // Reset start time when route changes
        startTimeRef.current = Date.now();

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set up tracking after delay
        timeoutRef.current = setTimeout(() => {
            const trackingData: TrackingData = {
                sessionId: getSessionId(), // ✅ Fix #7: Include session ID
                page: location.pathname,
                url: window.location.href,
                referrer: document.referrer,
                timeSpent: Math.floor((Date.now() - startTimeRef.current) / 1000),
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
            };

            // Update deduplication tracking
            lastTrackedPathRef.current = location.pathname;
            lastTrackedTimeRef.current = Date.now();

            // ✅ Fix #3: Add keepalive to ensure data is sent even if user navigates away
            fetch(TRACKING_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trackingData),
                keepalive: true, // Ensures request completes even if page unloads
            }).catch((error) => {
                // ✅ Fix #5: Better error logging for debugging
                if (import.meta.env.DEV) {
                    console.warn('Activity tracking failed:', error);
                }
                // In production, silently fail to not disrupt UX
            });
        }, TRACKING_DELAY);

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [location.pathname]); // Re-run when route changes
};

// ✅ Bonus: Export utility functions for consent management
export const setTrackingConsent = (consent: boolean): void => {
    localStorage.setItem('tracking_consent', consent.toString());
};

export const getTrackingConsent = (): boolean => {
    return hasTrackingConsent();
};

export const clearSession = (): void => {
    localStorage.removeItem('aivestire_session_id');
};
