import { useEffect, useState } from 'react';
import { User, Ruler, Weight, Palette, Sparkles } from 'lucide-react';

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
}

export function AuraDisplayCard({ aura, tryOnCount = 0 }: AuraDisplayCardProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="ai-tryon-aura-card">
            {/* Mobile Toggle */}
            <button
                className="lg:hidden w-full flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl mb-4"
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    border: '1px solid rgba(201, 165, 92, 0.2)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
            >
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-gold" />
                    <span className="font-semibold text-charcoal">Your Aura</span>
                </div>
                <span className="text-sm text-charcoal/60">
                    {isCollapsed ? 'Show' : 'Hide'}
                </span>
            </button>

            {/* Aura Card Content */}
            <div
                className={`aura-card-content ${isCollapsed ? 'hidden lg:block' : 'block'}`}
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 247, 240, 0.95) 100%)',
                    border: '1px solid rgba(201, 165, 92, 0.2)',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    position: 'sticky',
                    top: '100px',
                }}
            >
                {/* Avatar Image */}
                <div
                    className="relative mb-6 overflow-hidden"
                    style={{
                        borderRadius: '20px',
                        border: '3px solid rgba(201, 165, 92, 0.3)',
                        boxShadow: '0 4px 16px rgba(201, 165, 92, 0.2)',
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
                        className="absolute top-3 right-3 p-2 rounded-full"
                        style={{
                            background: 'rgba(201, 165, 92, 0.9)',
                            boxShadow: '0 2px 8px rgba(201, 165, 92, 0.4)',
                        }}
                    >
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                </div>

                {/* Aura Info */}
                <div className="space-y-4">
                    {/* Title */}
                    <div className="text-center pb-4 border-b border-gold/20">
                        <h3 className="text-xl font-bold text-charcoal mb-1">
                            Your AI Avatar
                        </h3>
                        <p className="text-sm text-charcoal/60">
                            {tryOnCount} try-ons completed
                        </p>
                    </div>

                    {/* Attributes */}
                    <div className="space-y-3">
                        <AttributeRow
                            icon={<Ruler className="w-4 h-4" />}
                            label="Height"
                            value={`${aura.height_cm} cm`}
                        />
                        <AttributeRow
                            icon={<Weight className="w-4 h-4" />}
                            label="Weight"
                            value={`${aura.weight_kg} kg`}
                        />
                        <AttributeRow
                            icon={<Palette className="w-4 h-4" />}
                            label="Skin Tone"
                            value={aura.skin_tone}
                        />
                        <AttributeRow
                            icon={<User className="w-4 h-4" />}
                            label="Body Shape"
                            value={aura.body_shape}
                        />
                    </div>

                    {/* Additional Info */}
                    <div
                        className="mt-4 p-3 rounded-xl text-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.08) 0%, rgba(201, 165, 92, 0.12) 100%)',
                        }}
                    >
                        <p className="text-xs text-charcoal/70">
                            {aura.gender} • {aura.age_range}
                        </p>
                        <p className="text-xs text-charcoal/70 mt-1">
                            {aura.hair_style}
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
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/50">
            <div className="flex items-center gap-2">
                <span className="text-gold">{icon}</span>
                <span className="text-sm font-medium text-charcoal/70">{label}</span>
            </div>
            <span className="text-sm font-semibold text-charcoal">{value}</span>
        </div>
    );
}
