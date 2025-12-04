import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Ruler, Weight, Palette, Users, Calendar, Scissors } from "lucide-react";

interface AuraData {
    aura_id: string;
    user_id: string;
    image_url: string;
    model_url?: string;
    height_cm?: number;
    weight_kg?: number;
    skin_tone?: string;
    gender?: string;
    body_shape?: string;
    age_range?: string;
    hair_style?: string;
    status: string;
    created_at: string;
}

export default function AuraProfile() {
    const [aura, setAura] = useState<AuraData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAura = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    navigate('/user-login');
                    return;
                }

                const response = await fetch('http://localhost:3000/aura', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch Aura');
                }

                const data = await response.json();
                setAura(data);
            } catch (error) {
                console.error('Error fetching Aura:', error);
                navigate('/aura-dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchAura();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-ivory via-[#f2ead8] to-ivory flex items-center justify-center">
                <div className="text-charcoal text-xl font-serif">Loading your Aura...</div>
            </div>
        );
    }

    if (!aura) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-ivory via-[#f2ead8] to-ivory flex items-center justify-center">
                <div className="text-charcoal text-xl font-serif">No Aura found</div>
            </div>
        );
    }

    const attributes = [
        { icon: Ruler, label: "Height", value: aura.height_cm ? `${aura.height_cm} cm` : "Not specified" },
        { icon: Weight, label: "Weight", value: aura.weight_kg ? `${aura.weight_kg} kg` : "Not specified" },
        { icon: Palette, label: "Skin Tone", value: aura.skin_tone || "Not specified" },
        { icon: Users, label: "Gender", value: aura.gender || "Not specified" },
        { icon: User, label: "Body Shape", value: aura.body_shape || "Not specified" },
        { icon: Calendar, label: "Age Range", value: aura.age_range || "Not specified" },
        { icon: Scissors, label: "Hair Style", value: aura.hair_style || "Not specified" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-ivory via-[#f2ead8] to-ivory py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif text-charcoal mb-3">
                        Your <span className="text-gold">Aura</span> Profile
                    </h1>
                    <p className="text-charcoal/70 text-lg">Your digital fashion identity</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Aura Image Card */}
                    <div className="bg-white rounded-3xl shadow-xl border-2 border-gold/30 p-8">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gold/10 to-gold/5 border-2 border-gold/20">
                            <img
                                src={aura.image_url}
                                alt="Your Aura"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="mt-6 text-center">
                            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${aura.status === 'READY'
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                }`}>
                                {aura.status}
                            </div>
                            <p className="text-charcoal/60 text-sm mt-3">
                                Created {new Date(aura.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Attributes Card */}
                    <div className="bg-white rounded-3xl shadow-xl border-2 border-gold/30 p-8">
                        <h2 className="text-2xl font-serif text-charcoal mb-6 pb-4 border-b-2 border-gold/20">
                            Body Attributes
                        </h2>
                        <div className="space-y-4">
                            {attributes.map((attr, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gold/5 to-transparent border border-gold/10 hover:border-gold/30 transition-all duration-300"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                                        <attr.icon className="w-5 h-5 text-gold" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-charcoal/60 font-medium">{attr.label}</p>
                                        <p className="text-charcoal font-semibold">{attr.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 pt-6 border-t-2 border-gold/20 flex gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-gold/80 to-gold/60 text-white rounded-full font-medium hover:from-gold hover:to-gold/80 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                Back to Home
                            </button>
                            <button
                                onClick={() => navigate('/aura-dashboard')}
                                className="flex-1 px-6 py-3 bg-ivory border-2 border-gold/40 text-charcoal rounded-full font-medium hover:bg-gold/10 hover:border-gold transition-all duration-300 hover:scale-105"
                            >
                                Edit Aura
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
