import React from 'react';
import { UserDashboardLayout } from '@/components/layout/UserDashboardLayout';
import { Package, Heart, MapPin, ShoppingBag } from 'lucide-react';

export const UserDashboard = () => {
    return (
        <UserDashboardLayout>
            <div className="min-h-screen bg-[#FAFAF8]">
                {/* Header */}
                <div className="bg-white border-b border-[#E0E0D8] px-8 py-6">
                    <h1 className="text-3xl font-bold text-[#2C2416] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Dashboard
                    </h1>
                    <p className="text-[#6B6B6B]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        Welcome to your account dashboard
                    </p>
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
                            <h3 className="text-2xl font-bold text-[#2C2416] mb-1">0</h3>
                            <p className="text-sm text-[#6B6B6B]">Total Orders</p>
                        </div>

                        {/* Wishlist Card */}
                        <div className="bg-white rounded-xl border border-[#E0E0D8] p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <Heart className="w-6 h-6 text-red-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-[#2C2416] mb-1">0</h3>
                            <p className="text-sm text-[#6B6B6B]">Wishlist Items</p>
                        </div>

                        {/* Addresses Card */}
                        <div className="bg-white rounded-xl border border-[#E0E0D8] p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-blue-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-[#2C2416] mb-1">0</h3>
                            <p className="text-sm text-[#6B6B6B]">Saved Addresses</p>
                        </div>

                        {/* Cart Card */}
                        <div className="bg-white rounded-xl border border-[#E0E0D8] p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <ShoppingBag className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-[#2C2416] mb-1">0</h3>
                            <p className="text-sm text-[#6B6B6B]">Cart Items</p>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="mt-8 bg-white rounded-xl border border-[#E0E0D8] p-6">
                        <h2 className="text-xl font-bold text-[#2C2416] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Recent Activity
                        </h2>
                        <div className="text-center py-12">
                            <p className="text-[#6B6B6B]">No recent activity to show</p>
                        </div>
                    </div>
                </div>
            </div>
        </UserDashboardLayout>
    );
};

export default UserDashboard;
