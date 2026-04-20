import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserDashboardLayout } from '@/components/layout/UserDashboardLayout';
import { Package, Heart, MapPin, ShoppingBag, Clock } from 'lucide-react';
import { getUserDashboardStats } from '@/lib/api';

interface DashboardStats {
    totalOrders: number;
    wishlistItems: number;
    savedAddresses: number;
    cartItems: number;
}

interface Activity {
    id: string;
    type: string;
    title: string;
    status?: string;
    date: string;
    amount?: string;
}

export const UserDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const data = await getUserDashboardStats();
                setStats(data.stats);
                setActivities(data.recentActivity);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getStatusStyles = (status?: string) => {
        switch (status?.toUpperCase()) {
            case 'DELIVERED':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'OUT_FOR_DELIVERY':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'SHIPPED':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'BOOKED':
            case 'DISPATCHED':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'ORDER':
                return <Package className="w-5 h-5 text-[#C9A55C]" />;
            case 'WISHLIST':
                return <Heart className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-[#6B6B6B]" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <UserDashboardLayout>
            <div className="min-h-screen bg-[#FAFAF8]">
                {/* Header */}
                <div className="bg-white border-b border-[#E0E0D8] px-8 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2C2416] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Dashboard
                        </h1>
                        <p className="text-[#6B6B6B]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            Welcome to your account dashboard
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/')} 
                        className="px-4 py-2 bg-[#C9A55C] text-white text-sm font-medium rounded-lg hover:bg-[#b08d4b] transition-colors whitespace-nowrap shadow-sm"
                    >
                        Back to Home
                    </button>
                </div>

                {/* Dashboard Content */}
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Orders Card */}
                        <div className="bg-white rounded-xl border border-[#E0E0D8] p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-[#C9A55C]/10 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-[#C9A55C]" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-[#2C2416] mb-1">
                                {loading ? '...' : stats?.totalOrders || 0}
                            </h3>
                            <p className="text-sm text-[#6B6B6B]">Total Orders</p>
                        </div>

                        {/* Wishlist Card */}
                        <div className="bg-white rounded-xl border border-[#E0E0D8] p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <Heart className="w-6 h-6 text-red-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-[#2C2416] mb-1">
                                {loading ? '...' : stats?.wishlistItems || 0}
                            </h3>
                            <p className="text-sm text-[#6B6B6B]">Wishlist Items</p>
                        </div>

                        {/* Addresses Card */}
                        <div className="bg-white rounded-xl border border-[#E0E0D8] p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-blue-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-[#2C2416] mb-1">
                                {loading ? '...' : stats?.savedAddresses || 0}
                            </h3>
                            <p className="text-sm text-[#6B6B6B]">Saved Addresses</p>
                        </div>

                        {/* Cart Card */}
                        <div className="bg-white rounded-xl border border-[#E0E0D8] p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <ShoppingBag className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-[#2C2416] mb-1">
                                {loading ? '...' : stats?.cartItems || 0}
                            </h3>
                            <p className="text-sm text-[#6B6B6B]">Cart Items</p>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="mt-8 bg-white rounded-xl border border-[#E0E0D8] p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[#2C2416]" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Recent Activity
                            </h2>
                            <Clock className="w-5 h-5 text-[#C9A55C]" />
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-[#6B6B6B]">Loading activity...</p>
                            </div>
                        ) : activities.length > 0 ? (
                            <div className="space-y-4">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="group flex items-center justify-between p-5 rounded-xl border border-[#F0F0E8] hover:border-[#C9A55C] hover:bg-[#C9A55C]/5 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-[#E0E0D8] flex items-center justify-center group-hover:border-[#C9A55C] transition-colors shadow-sm">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#2C2416] group-hover:text-[#C9A55C] transition-colors">
                                                    {activity.title}
                                                </p>
                                                <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5 mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(activity.date)}
                                                </p>
                                            </div>
                                        </div>
                                        {activity.type === 'ORDER' && (
                                            <div className="flex flex-col items-end gap-2">
                                                <p className="font-bold text-[#2C2416] text-lg">₹{activity.amount}</p>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(activity.status)}`}>
                                                    {activity.status?.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        )}
                                        {activity.type === 'WISHLIST' && (
                                            <div className="text-right">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-red-50 text-red-600 border-red-100">
                                                    Wishlist
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-[#F0F0E8] rounded-xl">
                                <p className="text-[#6B6B6B]">No recent activity to show</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UserDashboardLayout>
    );
};

export default UserDashboard;
