import axios from 'axios';
import { AuraStatus as AuraStatusEnum } from '../types/aura';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface AuraStatusResponse {
    hasAura: boolean;
    auraStatus?: AuraStatusEnum;
    auraId?: string;
    message?: string;
}

/**
 * Check if user has an Aura
 * @param userId - User ID to check
 * @returns Promise with Aura status
 */
export async function checkAuraStatus(userId: string): Promise<AuraStatusResponse> {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/aura/status/${userId}`);

        if (response.data.hasAura) {
            return {
                hasAura: true,
                auraStatus: response.data.status,
                auraId: response.data.auraId,
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
 * @param userId - User ID to check
 * @param navigate - React Router navigate function
 * @param redirectPath - Path to redirect to if no Aura (default: '/aura-dashboard')
 * @returns Promise<boolean> - true if user has Aura, false otherwise
 */
export async function auraGate(
    userId: string,
    navigate: (path: string) => void,
    redirectPath: string = '/aura-dashboard'
): Promise<boolean> {
    const status = await checkAuraStatus(userId);

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
