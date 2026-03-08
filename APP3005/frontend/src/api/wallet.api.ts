// ============================================
// WALLET API SERVICE
// ============================================

import type {
    Wallet,
    WalletTransactionsResponse,
    CreditWalletPayload,
    DebitWalletPayload,
    AdminCreditPayload,
    WalletMutationResponse,
} from '@/types/wallet.types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login to access wallet');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

// GET /wallet — fetch wallet balance
export async function getWalletApi(): Promise<Wallet> {
    const res = await fetch(`${BASE_URL}/wallet`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch wallet');
    return data;
}

// GET /wallet/transactions — fetch paginated transactions
export async function getTransactionsApi(
    page = 1,
    limit = 10,
): Promise<WalletTransactionsResponse> {
    const res = await fetch(
        `${BASE_URL}/wallet/transactions?page=${page}&limit=${limit}`,
        { method: 'GET', headers: getAuthHeaders() },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch transactions');
    return data;
}

// POST /wallet/credit — credit wallet
export async function creditWalletApi(
    payload: CreditWalletPayload,
): Promise<WalletMutationResponse> {
    const res = await fetch(`${BASE_URL}/wallet/credit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to credit wallet');
    return data;
}

// POST /wallet/debit — debit wallet
export async function debitWalletApi(
    payload: DebitWalletPayload,
): Promise<WalletMutationResponse> {
    const res = await fetch(`${BASE_URL}/wallet/debit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to debit wallet');
    return data;
}

// POST /wallet/admin-credit — admin wallet credit (uses cookies)
export async function adminCreditWalletApi(
    payload: AdminCreditPayload,
): Promise<WalletMutationResponse> {
    const res = await fetch(`${BASE_URL}/wallet/admin-credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to credit wallet');
    return data;
}
