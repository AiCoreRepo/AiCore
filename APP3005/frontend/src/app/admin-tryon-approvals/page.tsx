import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, X, User, CheckCircle2, Clock } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import { getPendingTryOnPermissions, getApprovedTryOnPermissions, resolveTryOnPermission } from '@/lib/api';
import { typography } from '@/constants/theme';
import { cn } from '@/utils/cn';

interface PendingRequest {
    user_id: string;
    email: string;
    created_at: string;
    try_on_permission: string;
}

type TabType = 'PENDING' | 'APPROVED';

function AdminTryOnApprovals() {
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('PENDING');

    useEffect(() => {
        loadRequests();
    }, [activeTab]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = activeTab === 'PENDING'
                ? await getPendingTryOnPermissions()
                : await getApprovedTryOnPermissions();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load try-on requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            setActioning(userId);
            await resolveTryOnPermission(userId, status);
            setRequests(requests.filter(r => r.user_id !== userId));
        } catch (error) {
            console.error('Failed to resolve request:', error);
            alert('Failed to update status');
        } finally {
            setActioning(null);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex">
            <Sidebar />

            <main className="flex-1 ml-[280px] p-8">
                <div className="max-w-[1200px] mx-auto space-y-8">
                    <div className="flex justify-between items-end">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h1
                                className="text-4xl font-bold text-neutral-100 mb-2"
                                style={{ fontFamily: typography.fontSerif }}
                            >
                                Try-On Approvals
                            </h1>
                            <p className="text-neutral-400">
                                Manage access requests for the Virtual Try-On feature
                            </p>
                        </motion.div>

                        {/* Tabs */}
                        <div className="flex bg-neutral-800 p-1 rounded-xl border border-white/5 relative">
                            <button
                                onClick={() => setActiveTab('PENDING')}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative z-10",
                                    activeTab === 'PENDING'
                                        ? "text-gold"
                                        : "text-neutral-400 hover:text-neutral-200"
                                )}
                            >
                                <Clock className="w-4 h-4" />
                                Pending
                                {activeTab === 'PENDING' && (
                                    <motion.div
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold mx-4"
                                    />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('APPROVED')}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative z-10",
                                    activeTab === 'APPROVED'
                                        ? "text-gold"
                                        : "text-neutral-400 hover:text-neutral-200"
                                )}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Approved
                                {activeTab === 'APPROVED' && (
                                    <motion.div
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold mx-4"
                                    />
                                )}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center py-20"
                            >
                                <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
                            </motion.div>
                        ) : requests.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-center py-20 bg-neutral-800/50 rounded-3xl border border-neutral-700/50"
                            >
                                <User className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-neutral-400">
                                    No {activeTab.toLowerCase()} Requests
                                </h3>
                                <p className="text-neutral-500 mt-2">
                                    {activeTab === 'PENDING'
                                        ? "All try-on access requests have been processed."
                                        : "No users have been approved for try-on yet."}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-neutral-800/50 rounded-3xl border border-neutral-700/50 overflow-hidden"
                            >
                                <table className="w-full text-left">
                                    <thead className="bg-neutral-800 text-neutral-400 text-sm uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">User Email</th>
                                            <th className="px-6 py-4 font-semibold">Request Date</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-700/50">
                                        {requests.map((request) => (
                                            <tr key={request.user_id} className="hover:bg-neutral-700/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-gold" />
                                                        </div>
                                                        <span className="text-neutral-200 font-medium">{request.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-neutral-400">
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {activeTab === 'PENDING' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(request.user_id, 'APPROVED')}
                                                                    disabled={actioning === request.user_id}
                                                                    className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all border border-green-500/20"
                                                                    title="Approve"
                                                                >
                                                                    <Check className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(request.user_id, 'REJECTED')}
                                                                    disabled={actioning === request.user_id}
                                                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"
                                                                    title="Reject"
                                                                >
                                                                    <X className="w-5 h-5" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAction(request.user_id, 'REJECTED')}
                                                                disabled={actioning === request.user_id}
                                                                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20 text-xs font-medium"
                                                            >
                                                                Revoke Access
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

export default AdminTryOnApprovals;
