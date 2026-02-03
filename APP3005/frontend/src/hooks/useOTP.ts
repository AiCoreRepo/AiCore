import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface UseOTPReturn {
    sendOTP: (phoneNumber: string) => Promise<boolean>;
    verifyOTP: (phoneNumber: string, otp: string) => Promise<{ success: boolean; token?: string }>;
    resendOTP: (phoneNumber: string) => Promise<boolean>;
    isLoading: boolean;
    error: string | null;
    countdown: number;
    canResend: boolean;
    startCountdown: () => void;
}

const RESEND_COOLDOWN = 60; // 60 seconds
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const useOTP = (): UseOTPReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const { toast } = useToast();

    const startCountdown = useCallback(() => {
        setCountdown(RESEND_COOLDOWN);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const sendOTP = useCallback(async (phoneNumber: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${BASE_URL}/auth/otp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phoneNumber }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send OTP');
            }

            const data = await response.json();
            toast({
                title: 'OTP Sent',
                description: `Verification code sent to ${phoneNumber}`,
            });

            startCountdown();
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [toast, startCountdown]);

    const verifyOTP = useCallback(async (
        phoneNumber: string,
        otp: string
    ): Promise<{ success: boolean; token?: string }> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${BASE_URL}/auth/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phoneNumber, otp }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Invalid OTP');
            }

            const data = await response.json();
            toast({
                title: 'Success',
                description: 'Phone number verified successfully!',
            });

            return { success: true, token: data.token };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Invalid OTP';
            setError(errorMessage);
            toast({
                title: 'Verification Failed',
                description: errorMessage,
                variant: 'destructive',
            });
            return { success: false };
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const resendOTP = useCallback(async (phoneNumber: string): Promise<boolean> => {
        if (countdown > 0) {
            toast({
                title: 'Please Wait',
                description: `You can resend OTP in ${countdown} seconds`,
                variant: 'destructive',
            });
            return false;
        }

        return sendOTP(phoneNumber);
    }, [countdown, sendOTP, toast]);

    return {
        sendOTP,
        verifyOTP,
        resendOTP,
        isLoading,
        error,
        countdown,
        canResend: countdown === 0,
        startCountdown,
    };
};
