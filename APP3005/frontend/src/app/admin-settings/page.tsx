import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/admin/Sidebar';
import { PasswordSection } from '@/components/admin/settings/PasswordSection';
import { NotificationsSection } from '@/components/admin/settings/NotificationsSection';
import { Lock, User, Bell, Palette, Shield } from 'lucide-react';
import { typography } from '@/constants/theme';

type SettingsTab = 'password' | 'profile' | 'notifications' | 'appearance' | 'security';

/**
 * Admin Settings Page
 * Comprehensive settings interface for admin users
 */
const AdminSettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('password');

    const tabs = [
        { id: 'password' as SettingsTab, label: 'Password & Security', icon: Lock },
        { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
        { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
        { id: 'appearance' as SettingsTab, label: 'Appearance', icon: Palette },
        { id: 'security' as SettingsTab, label: 'Security Log', icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-neutral-900 flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 ml-[280px] p-8">
                <div className="max-w-5xl mx-auto space-y-8">
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
                            Settings
                        </h1>
                        <p className="text-neutral-400">
                            Manage your account settings and preferences
                        </p>
                    </motion.div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.id
                                        ? 'text-[#D4AF37]'
                                        : 'text-neutral-400 hover:text-neutral-200'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8"
                    >
                        {activeTab === 'password' && <PasswordSection />}

                        {activeTab === 'profile' && (
                            <div className="text-center py-12 text-neutral-400">
                                <User className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
                                <p className="text-lg">Profile settings coming soon</p>
                            </div>
                        )}

                        {activeTab === 'notifications' && <NotificationsSection />}

                        {activeTab === 'appearance' && (
                            <div className="text-center py-12 text-neutral-400">
                                <Palette className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
                                <p className="text-lg">Appearance settings coming soon</p>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="text-center py-12 text-neutral-400">
                                <Shield className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
                                <p className="text-lg">Security log coming soon</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default AdminSettingsPage;
