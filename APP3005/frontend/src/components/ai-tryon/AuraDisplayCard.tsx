import { useState } from 'react';
import { User, Ruler, Weight, Palette, Sparkles } from 'lucide-react';
import { getTryOnUsageSnapshot } from '@/lib/try-on-limit';

interface AuraData {
    aura_id: string;
    user_id: string;
    image_url: string | null;
    model_url: string | null;
    height_cm: number;
    weight_kg: number;
    skin_tone: string;
    gender: string;
    body_shape: string;
    age_range: string;
    hair_style: string;
    beard: string | null;
    extra_attributes: any;
}

interface AuraDisplayCardProps {
    aura: AuraData;
    tryOnCount?: number;
    maxTryOns?: number;
}

export function AuraDisplayCard({ aura, tryOnCount = 0, maxTryOns }: AuraDisplayCardProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const usage = getTryOnUsageSnapshot({
        try_ons_used: tryOnCount,
        max_try_ons: maxTryOns,
    });

    return (
        <div className="ai-tryon-aura-card">
            {/* Mobile Toggle */}
            <button
                className="lg:hidden w-full flex items-center justify-between p-5 bg-white rounded-2xl mb-4 shadow-sm group"
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    border: '1px solid rgba(212, 175, 55, 0.15)',
                }}
            >
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-luxury-gold" />
                    <span className="font-serif text-luxury-black text-lg">Your Aura</span>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 font-medium">
                    <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                    <span className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}>↓</span>
                </div>
            </button>

            {/* Aura Card Content */}
            <div
                className={`aura-card-content transition-all duration-500 ${isCollapsed ? 'hidden lg:block' : 'block'}`}
                style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(212, 175, 55, 0.1)',
                    borderRadius: '28px',
                    padding: '28px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
                    position: 'sticky',
                    top: '120px',
                }}
            >
                {/* Avatar Image */}
                <div
                    className="relative mb-6 overflow-hidden"
                    style={{
                        borderRadius: '20px',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        boxShadow: '0 8px 25px rgba(212, 175, 55, 0.08)',
                    }}
                >
                    {aura.model_url || aura.image_url ? (
                        <img
                            src={aura.model_url || aura.image_url || ''}
                            alt="Your Aura Avatar"
                            className="w-full h-auto object-cover"
                            style={{ aspectRatio: '3/4' }}
                        />
                    ) : (
                        <div
                            className="w-full flex items-center justify-center bg-gradient-to-br from-gold/10 to-gold/5"
                            style={{ aspectRatio: '3/4' }}
                        >
                            <User className="w-24 h-24 text-gold/40" />
                        </div>
                    )}

                    {/* Sparkle Overlay */}
                    <div
                        className="absolute top-3 right-3 p-2.5 rounded-full"
                        style={{
                            background: '#D4AF37',
                            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                        }}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                </div>

                {/* Aura Info */}
                <div className="space-y-4">
                    {/* Title */}
                    <div className="text-center pb-6 border-b border-neutral-100">
                        <h3 className="text-2xl font-serif text-luxury-black mb-1">
                            Your AI Avatar
                        </h3>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium">
                            {usage.tryOnsUsed} Looks Generated
                        </p>
                    </div>

                    <div
                        className="rounded-2xl px-4 py-4 text-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(248, 244, 236, 0.9))',
                            border: '1px solid rgba(212, 175, 55, 0.16)',
                        }}
                    >
                        <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500 font-medium">
                            Try-On Balance
                        </p>
                        <p className="mt-2 text-2xl font-serif text-luxury-black">
                            {usage.remainingTryOns} / {usage.maxTryOns}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                            Complimentary try-ons remaining
                        </p>
                    </div>

                    {/* Attributes */}
                    <div className="space-y-3">
                        <AttributeRow
                            icon={<Ruler className="w-4 h-4" />}
                            label="Height"
                            value={aura.height_cm ? `${aura.height_cm} cm` : '175 cm'}
                        />
                        <AttributeRow
                            icon={<Weight className="w-4 h-4" />}
                            label="Weight"
                            value={aura.weight_kg ? `${aura.weight_kg} kg` : '70 kg'}
                        />
                        <AttributeRow
                            icon={<Palette className="w-4 h-4" />}
                            label="Skin Tone"
                            value={aura.skin_tone || 'Natural'}
                        />
                        <AttributeRow
                            icon={<User className="w-4 h-4" />}
                            label="Body Shape"
                            value={aura.body_shape || 'Athletic'}
                        />
                    </div>

                    {/* Additional Info */}
                    <div
                        className="mt-6 p-4 rounded-2xl text-center"
                        style={{
                            background: '#F8F4EC',
                        }}
                    >
                        <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">
                            {aura.gender || 'Universal'} • {aura.age_range || 'Adult'}
                        </p>
                        <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-medium mt-1">
                            {aura.hair_style || 'Natural Hair'}
                            {aura.beard && ` • ${aura.beard}`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AttributeRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between p-3.5 rounded-xl transition-colors hover:bg-neutral-50">
            <div className="flex items-center gap-3">
                <span className="text-luxury-gold/70">{icon}</span>
                <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium">{label}</span>
            </div>
            <span className="text-sm font-semibold text-luxury-black">{value}</span>
        </div>
    );
}
