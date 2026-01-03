import React from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Users, Sparkles } from 'lucide-react';
import { typography } from '@/constants/theme';

/**
 * Clientele Page
 * Microservice 1 (Consumer): Buyer Management
 * User list, check Aura status, help stuck users
 */
function ClientelePage() {
    return (
        <div className="min-h-screen bg-neutral-900 flex">
            <Sidebar />

            <main className="flex-1 ml-[280px] p-8">
                <div className="max-w-[1800px] mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1
                            className="text-4xl font-bold text-neutral-100 mb-2"
                            style={{ fontFamily: typography.fontSerif }}
                        >
                            Clientele
                        </h1>
                        <p className="text-neutral-400">
                            Manage buyer accounts and Aura status
                        </p>
                    </div>

                    {/* Coming Soon */}
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                                <Users className="w-12 h-12 text-[#D4AF37]" />
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-100 mb-3">
                                Coming Soon
                            </h2>
                            <p className="text-neutral-400 max-w-md mx-auto">
                                The Clientele management interface is currently in development.
                                You'll be able to view buyer accounts, check Aura status, and assist users at the Aura Gate.
                            </p>
                            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500">
                                <Sparkles className="w-4 h-4" />
                                <span>Microservice 1: Consumer Service</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ClientelePage;
