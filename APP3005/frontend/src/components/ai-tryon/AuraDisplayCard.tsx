import { useState } from 'react';
import { User, Ruler, Weight, Palette, Sparkles } from 'lucide-react';
import { getTryOnUsageSnapshot } from '@/lib/try-on-limit';
import { AuraFramedImage } from '@/components/aura/AuraFramedImage';

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
    onBuyTryOns?: () => void;
}

export function AuraDisplayCard({ aura, tryOnCount = 0, maxTryOns, onBuyTryOns }: AuraDisplayCardProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const usage = getTryOnUsageSnapshot({
        try_ons_used: tryOnCount,
        max_try_ons: maxTryOns,
    });

    return (
        <div className="ai-tryon-aura-card">
            {/* Mobile Toggle */}
            <button
                className="group mb-4 flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm lg:hidden"
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
                className={`aura-card-content transition-all duration-500 ${isCollapsed ? 'hidden lg:block' : 'block'} rounded-[24px] p-5 sm:rounded-[28px] sm:p-7 lg:sticky lg:top-[120px]`}
                style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(212, 175, 55, 0.1)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
                }}
            >
                {/* Avatar Image */}
                <div
                    className="relative mb-6 overflow-hidden aspect-[3/4]"
                    style={{
                        borderRadius: '20px',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        boxShadow: '0 8px 25px rgba(212, 175, 55, 0.08)',
                    }}
                >
                    {aura.model_url || aura.image_url ? (
                        <AuraFramedImage
                            src={aura.model_url || aura.image_url || ''}
                            alt="Your Aura Avatar"
                            className="h-full w-full"
                            foregroundClassName="h-full w-full object-contain object-center p-3"
                            loading="eager"
                        />
                    ) : (
                        <div
                            className="w-full flex items-center justify-center bg-gradient-to-br from-gold/10 to-gold/5"
                            style={{ height: '100%' }}
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
                    <div className="border-b border-neutral-100 pb-5 text-center sm:pb-6">
                        <h3 className="mb-1 text-xl font-serif text-luxury-black sm:text-2xl">
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
                        {onBuyTryOns && (
                            <button
                                type="button"
                                onClick={onBuyTryOns}
                                className="mt-3 inline-flex items-center rounded-full border border-[#D4AF37]/35 bg-white/85 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7A5C13] transition hover:bg-white"
                            >
                                Buy Virtual Try-Ons
                            </button>
                        )}
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
                        className="mt-5 rounded-2xl p-4 text-center sm:mt-6"
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
        <div className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-neutral-50 sm:p-3.5">
            <div className="flex items-center gap-3">
                <span className="text-luxury-gold/70">{icon}</span>
                <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium">{label}</span>
            </div>
            <span className="text-right text-sm font-semibold text-luxury-black">{value}</span>
        </div>
    );
}
