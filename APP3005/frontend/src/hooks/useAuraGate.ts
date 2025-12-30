import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAuraStatus, AuraStatusResponse } from '../utils/auraGate';
import { AuraStatus } from '../types/aura';

/**
 * Custom hook to check Aura status and redirect if needed
 * @param userId - User ID to check
 * @param redirectPath - Path to redirect if no Aura (default: '/aura-dashboard')
 * @returns Object with loading state and Aura status
 */
export function useAuraGate(userId: string | null, redirectPath: string = '/aura-dashboard') {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [auraStatus, setAuraStatus] = useState<AuraStatusResponse | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const checkAura = async () => {
            setLoading(true);
            const status = await checkAuraStatus(userId);
            setAuraStatus(status);

            // Redirect if no Aura or not ready
            if (!status.hasAura || status.auraStatus !== AuraStatus.READY) {
                navigate(redirectPath);
            }

            setLoading(false);
        };

        checkAura();
    }, [userId, navigate, redirectPath]);

    return {
        loading,
        hasAura: auraStatus?.hasAura || false,
        auraStatus: auraStatus?.auraStatus,
        auraId: auraStatus?.auraId,
    };
}
