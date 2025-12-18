import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface TrackingData {
    page: string;
    url: string;
    referrer: string;
    timeSpent: number;
    userAgent: string;
    timestamp: string;
}

const TRACKING_ENDPOINT = 'https://atul56.app.n8n.cloud/webhook-test/track-visit';
const TRACKING_DELAY = 5000; // 5 seconds

export const useActivityTracking = () => {
    const location = useLocation();
    const startTimeRef = useRef<number>(Date.now());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Reset start time when route changes
        startTimeRef.current = Date.now();

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set up tracking after delay
        timeoutRef.current = setTimeout(() => {
            const trackingData: TrackingData = {
                page: location.pathname,
                url: window.location.href,
                referrer: document.referrer,
                timeSpent: Math.floor((Date.now() - startTimeRef.current) / 1000),
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
            };

            // Send tracking data
            fetch(TRACKING_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trackingData),
            }).catch((error) => {
                // Silently fail - don't disrupt user experience
                console.debug('Activity tracking failed:', error);
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
