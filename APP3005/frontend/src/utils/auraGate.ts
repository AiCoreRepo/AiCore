import axios from 'axios';
import { AuraStatus as AuraStatusEnum } from '../types/aura';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AuraStatusResponse {
    hasAura: boolean;
    auraStatus?: AuraStatusEnum;
    auraId?: string;
    message?: string;
}

/**
 * Check if user has an Aura
 * Uses the /aura/status endpoint which requires authentication
 * @returns Promise with Aura status
 */
export async function checkAuraStatus(): Promise<AuraStatusResponse> {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            return {
                hasAura: false,
                message: 'Not authenticated',
            };
        }

        const response = await axios.get(`${API_BASE_URL}/aura/status`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.data.hasAura) {
            return {
                hasAura: true,
                auraStatus: response.data.aura?.status,
                auraId: response.data.aura?.aura_id,
            };
        }

        return {
            hasAura: false,
            message: 'No Aura found',
        };
    } catch (error: any) {
        console.error('Error checking Aura status:', error);
        return {
            hasAura: false,
            message: error.response?.data?.message || 'Failed to check Aura status',
        };
    }
}

/**
 * Aura Gate - Check if user has Aura, redirect if not
 * @param navigate - React Router navigate function
 * @param redirectPath - Path to redirect to if no Aura (default: '/aura-dashboard')
 * @returns Promise<boolean> - true if user has Aura, false otherwise
 */
export async function auraGate(
    navigate: (path: string) => void,
    redirectPath: string = '/aura-dashboard'
): Promise<boolean> {
    const status = await checkAuraStatus();

    if (!status.hasAura) {
        console.log('No Aura found, redirecting to:', redirectPath);
        navigate(redirectPath);
        return false;
    }

    if (status.auraStatus !== AuraStatusEnum.READY) {
        console.log(`Aura not ready (status: ${status.auraStatus}), redirecting to:`, redirectPath);
        navigate(redirectPath);
        return false;
    }

    return true;
}
