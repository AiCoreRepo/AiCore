import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/admin/Sidebar';
import { StatsGrid } from '@/components/admin/StatsGrid';
import { ApprovalCard, Product } from '@/components/admin/ApprovalCard';
import { ApprovalModal } from '@/components/admin/ApprovalModal';
import { useDisclosure } from '@/hooks/useDisclosure';
import { typography, animations } from '@/constants/theme';
import { Loader2 } from 'lucide-react';

/**
 * Admin Dashboard Page
 * Main admin interface with stats, approval queue, and review modal
 */
const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState({
        totalCreators: 0,
        totalProducts: 0,
        pendingApprovals: 0,
        totalRevenue: 0,
    });
    const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const reviewModal = useDisclosure<Product>();

    // Fetch dashboard data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch stats (cookie-based auth)
                const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
                    credentials: 'include',
                });

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats({
                        totalCreators: statsData.totalCreators || 0,
                        totalProducts: statsData.totalProducts || 0,
                        pendingApprovals: statsData.pendingApprovals || 0,
                        totalRevenue: statsData.totalRevenue || 0,
                    });
                }

                // Fetch pending products
                const productsResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/products/pending`, {
                    credentials: 'include',
                });

                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    setPendingProducts(productsData);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleApprove = async (productId: string, comment?: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/products/${productId}/review`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'APPROVED',
                comment: comment || 'Approved',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to approve product');
        }

        // Refresh data
        setPendingProducts(prev => prev.filter(p => p.product_id !== productId));
        setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1, totalProducts: prev.totalProducts + 1 }));
    };

    const handleReject = async (productId: string, comment: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/products/${productId}/review`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'REJECTED',
                comment,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to reject product');
        }

        // Refresh data
        setPendingProducts(prev => prev.filter(p => p.product_id !== productId));
        setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1 }));
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 ml-[280px] p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1
                            className="text-4xl font-bold text-neutral-100 mb-2"
                            style={{ fontFamily: typography.fontSerif }}
                        >
                            Dashboard / <span className="text-neutral-400">Executive Overview</span>
                        </h1>
                        <p className="text-neutral-400">
                            Welcome back, Admin. Here's what's happening with your platform today.
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
                        </div>
                    ) : (
                        <motion.div
                            variants={animations.fadeIn}
                            initial="initial"
                            animate="animate"
                        >
                            <StatsGrid stats={stats} />
                        </motion.div>
                    )}

                    {/* Approval Queue */}
                    <motion.div
                        variants={animations.fadeIn}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-neutral-100"
                                    style={{ fontFamily: typography.fontSerif }}
                                >
                                    Approval Queue - High Priority
                                </h2>
                                <p className="text-sm text-neutral-400 mt-1">
                                    {pendingProducts.length} items awaiting review
                                </p>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                            </div>
                        ) : pendingProducts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {pendingProducts.map((product, index) => (
                                    <motion.div
                                        key={product.product_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <ApprovalCard
                                            product={product}
                                            onReview={(product) => reviewModal.open(product)}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-black/20 rounded-2xl border border-white/10">
                                <p className="text-neutral-400 text-lg">No pending approvals</p>
                                <p className="text-neutral-500 text-sm mt-2">All products have been reviewed</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>

            {/* Review Modal */}
            <ApprovalModal
                isOpen={reviewModal.isOpen}
                product={reviewModal.data}
                onClose={reviewModal.close}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </div>
    );
};

export default AdminDashboardPage;
