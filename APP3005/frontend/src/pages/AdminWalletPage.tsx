// ============================================
// ADMIN WALLET PAGE
// ============================================

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminWalletCredit } from '@/components/wallet/AdminWalletCredit';

const AdminWalletPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-neutral-950">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/50">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-neutral-300" />
                    </button>
                    <h1 className="text-white text-lg font-semibold">Admin — Wallet Management</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                <AdminWalletCredit />
            </div>
        </div>
    );
};

export default AdminWalletPage;
