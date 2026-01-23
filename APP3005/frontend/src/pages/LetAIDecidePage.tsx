import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuraDisplayCard } from '@/components/ai-tryon/AuraDisplayCard';
import { AuthPopup } from '@/components/AuthPopup';
import { getAura } from '@/lib/api';
import { getAIRecommendations, type RecommendationRequest, type RecommendationsResponse, type RecommendationItem } from '@/lib/api-recommendations';
import { Sparkles, Heart, Star, Wand2, AlertCircle, Loader2 } from 'lucide-react';

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

const inspirationalQuotes = [
    { quote: 'Style is a way to say who you are without having to speak.', author: 'Rachel Zoe' },
    { quote: 'Fashion is about dressing according to what is fashionable. Style is more about being yourself.', author: 'Oscar de la Renta' },
    { quote: 'Elegance is not standing out, but being remembered.', author: 'Giorgio Armani' },
    { quote: 'Fashion fades, only style remains the same.', author: 'Coco Chanel' },
    { quote: 'The joy of dressing is an art.', author: 'John Galliano' }
];

const occasions = [
    { value: 'Formal', label: 'Formal', icon: '👔', description: 'Professional & Elegant' },
    { value: 'Party', label: 'Party', icon: '🎉', description: 'Festive & Fun' },
    { value: 'Wedding', label: 'Wedding', icon: '💒', description: 'Traditional & Graceful' },
    { value: 'Casual luxury', label: 'Casual Luxury', icon: '✨', description: 'Relaxed & Refined' },
    { value: 'Resort', label: 'Resort', icon: '🏖️', description: 'Breezy & Comfortable' },
];

const LetAIDecidePage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [aura, setAura] = useState<AuraData | null>(null);
    const [loadingAura, setLoadingAura] = useState(true);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showAuraPopup, setShowAuraPopup] = useState(false);
    const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentQuote] = useState(() => inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]);

    useEffect(() => {
        // Wait for auth to load
        if (authLoading) return;

        // Check if user is logged in
        if (!user) {
            console.log(' User not logged in, showing popup');
            setShowLoginPopup(true);
            setLoadingAura(false);
            return;
        }

        // User is logged in, check aura
        checkAuraStatus();
    }, [authLoading, user]);

    const checkAuraStatus = async () => {
        try {
            setLoadingAura(true);
            const auraData = await getAura();
            setAura(auraData);
        } catch (error: any) {
            console.error('Error fetching Aura:', error);
            setShowAuraPopup(true);
        } finally {
            setLoadingAura(false);
        }
    };



    const handleGetRecommendations = async (occasion: string) => {
        if (!aura) {
            setShowAuraPopup(true);
            return;
        }

        try {
            setSelectedOccasion(occasion);
            setLoadingRecommendations(true);
            setError(null);

            const request: RecommendationRequest = {
                occasion: occasion as any,
                top_k: 12,
            };

            const result = await getAIRecommendations(request);
            setRecommendations(result);
        } catch (error: any) {
            console.error('Recommendation error:', error);
            setError(error.message || 'Failed to get recommendations. Please try again.');
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const renderRecommendationCard = (item: RecommendationItem, tier: 'perfect' | 'good' | 'try') => {
        const tierConfig = {
            perfect: { color: 'from-gold/20 to-gold/5 border-gold/40', icon: <Star className="w-5 h-5 text-gold fill-gold" /> },
            good: { color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30', icon: <Heart className="w-5 h-5 text-blue-500 fill-blue-500" /> },
            try: { color: 'from-purple-500/20 to-purple-500/5 border-purple-500/30', icon: <Sparkles className="w-5 h-5 text-purple-500" /> },
        };

        const config = tierConfig[tier];

        const handleClick = () => {
            if (item.slug) {
                navigate(`/product/${item.slug}`);
            }
        };

        return (
            <div
                key={item.id}
                onClick={handleClick}
                className={`glass-panel rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer bg-gradient-to-br ${config.color}`}
            >
                {item.image && (
                    <div className="aspect-[3/4] bg-ivory/30 overflow-hidden">
                        <img
                            src={item.image}
                            alt={item.title || item.description || 'Recommended outfit'}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {config.icon}
                            <span className="text-xs font-medium text-charcoal/70 uppercase tracking-wide">
                                {item.score_label}
                            </span>
                        </div>
                        <div className="text-sm font-bold text-charcoal">
                            {Math.round(item.final_score * 100)}% Match
                        </div>
                    </div>

                    {item.title && (
                        <h3 className="font-serif text-lg text-charcoal line-clamp-2">
                            {item.title}
                        </h3>
                    )}

                    {item.creator_name && (
                        <p className="text-xs text-charcoal/50">
                            by {item.creator_name}
                        </p>
                    )}

                    {item.description && (
                        <p className="text-sm text-charcoal/60 line-clamp-2">
                            {item.description}
                        </p>
                    )}

                    {item.price_cents && (
                        <div className="text-xl font-bold text-gold">
                            ₹{(item.price_cents / 100).toFixed(2)}
                        </div>
                    )}

                    {item.inventory_count !== undefined && item.inventory_count <= 5 && (
                        <p className="text-xs text-red-500 font-medium">
                            {item.inventory_count === 0 ? 'Out of Stock' : `Only ${item.inventory_count} left!`}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F0E6 0%, #FFF8E7 50%, #F5F0E6 100%)' }}>
            <Navbar />

            <main className="pt-20 pb-12">
                <section className="py-12 border-b border-gold/20">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-4xl mx-auto">
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <Wand2 className="w-10 h-10 text-gold animate-pulse" />
                                <h1 className="text-5xl md:text-6xl font-serif font-bold text-charcoal">
                                    Let AI Decide
                                </h1>
                            </div>

                            <p className="text-xl text-charcoal/80 mb-8 leading-relaxed">
                                Discover your perfect outfit with AI-powered precision. Our intelligent system analyzes your unique style, body shape, and preferences to curate personalized recommendations just for you.
                            </p>

                            <div className="glass-panel rounded-2xl p-8 mb-8 border-2 border-gold/30">
                                <div className="flex items-start gap-4">
                                    <Sparkles className="w-8 h-8 text-gold flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-2xl font-serif italic text-charcoal mb-3 leading-relaxed">
                                            "{currentQuote.quote}"
                                        </p>
                                        <p className="text-sm font-medium text-gold">
                                            — {currentQuote.author}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-8">
                    <div className="container mx-auto px-4">
                        {loadingAura && (
                            <div className="text-center py-20">
                                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gold border-t-transparent mb-4" />
                                <p className="text-charcoal/70 text-lg">Loading your Aura...</p>
                            </div>
                        )}

                        {!loadingAura && aura && (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-1">
                                    <AuraDisplayCard aura={aura} />
                                </div>

                                <div className="lg:col-span-3 space-y-8">
                                    {!recommendations && (
                                        <>
                                            <div className="glass-panel rounded-3xl p-8">
                                                <h2 className="text-3xl font-serif font-bold text-charcoal mb-6 text-center">
                                                    Choose Your Occasion
                                                </h2>
                                                <p className="text-center text-charcoal/70 mb-8">
                                                    Select the occasion and let our AI find the perfect outfits for you
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {occasions.map((occasion) => (
                                                        <button
                                                            key={occasion.value}
                                                            onClick={() => handleGetRecommendations(occasion.value)}
                                                            disabled={loadingRecommendations}
                                                            className="glass-panel rounded-2xl p-6 border-2 border-gold/20 hover:border-gold hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <div className="text-5xl mb-3">{occasion.icon}</div>
                                                            <h3 className="text-xl font-serif font-bold text-charcoal mb-2">
                                                                {occasion.label}
                                                            </h3>
                                                            <p className="text-sm text-charcoal/60">
                                                                {occasion.description}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {loadingRecommendations && (
                                                <div className="glass-panel rounded-3xl p-12 text-center">
                                                    <Loader2 className="w-16 h-16 text-gold animate-spin mx-auto mb-4" />
                                                    <h3 className="text-2xl font-serif font-bold text-charcoal mb-2">
                                                        AI is Curating Your Perfect Outfits...
                                                    </h3>
                                                    <p className="text-charcoal/70">
                                                        Analyzing your style preferences and body shape
                                                    </p>
                                                </div>
                                            )}

                                            {error && (
                                                <div className="glass-panel rounded-3xl p-8 border-2 border-red-500/30 bg-red-500/5">
                                                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                                    <p className="text-center text-charcoal font-medium">{error}</p>
                                                    <button
                                                        onClick={() => selectedOccasion && handleGetRecommendations(selectedOccasion)}
                                                        className="btn-gold-glow mt-4 mx-auto block"
                                                    >
                                                        Try Again
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {recommendations && !loadingRecommendations && (
                                        <div className="space-y-8">
                                            {/* Filter Badge - Shows selected occasion */}
                                            {selectedOccasion && (
                                                <div className="glass-panel rounded-2xl p-6 border-2 border-gold/40 bg-gradient-to-r from-gold/10 to-gold/5">
                                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-4xl">
                                                                {occasions.find(o => o.value === selectedOccasion)?.icon}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-charcoal/60 font-medium uppercase tracking-wide">
                                                                    Filtered by Occasion
                                                                </p>
                                                                <h3 className="text-2xl font-serif font-bold text-charcoal">
                                                                    {occasions.find(o => o.value === selectedOccasion)?.label}
                                                                </h3>
                                                                <p className="text-sm text-charcoal/70">
                                                                    {occasions.find(o => o.value === selectedOccasion)?.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-3xl font-bold text-gold">
                                                                {recommendations.count}
                                                            </p>
                                                            <p className="text-sm text-charcoal/60">
                                                                Products Found
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {recommendations.warnings && recommendations.warnings.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-gold/20">
                                                            <div className="flex items-start gap-2">
                                                                <AlertCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                                                                <div className="text-xs text-charcoal/60 space-y-1">
                                                                    {recommendations.warnings.map((warning, idx) => (
                                                                        <p key={idx}>{warning}</p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-3xl font-serif font-bold text-charcoal">
                                                    Your Personalized Recommendations
                                                </h2>
                                                <button
                                                    onClick={() => {
                                                        setRecommendations(null);
                                                        setSelectedOccasion(null);
                                                    }}
                                                    className="btn-gold-glow"
                                                >
                                                    Choose Another Occasion
                                                </button>
                                            </div>

                                            {recommendations.perfect_for_you.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Star className="w-6 h-6 text-gold fill-gold" />
                                                        <h3 className="text-2xl font-serif font-bold text-charcoal">
                                                            Perfect for You
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {recommendations.perfect_for_you.map((item) => renderRecommendationCard(item, 'perfect'))}
                                                    </div>
                                                </div>
                                            )}

                                            {recommendations.good_for_you.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Heart className="w-6 h-6 text-blue-500 fill-blue-500" />
                                                        <h3 className="text-2xl font-serif font-bold text-charcoal">
                                                            Good for You
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {recommendations.good_for_you.map((item) => renderRecommendationCard(item, 'good'))}
                                                    </div>
                                                </div>
                                            )}

                                            {recommendations.you_can_also_try.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Sparkles className="w-6 h-6 text-purple-500" />
                                                        <h3 className="text-2xl font-serif font-bold text-charcoal">
                                                            You Can Also Try
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {recommendations.you_can_also_try.map((item) => renderRecommendationCard(item, 'try'))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />

            {/* Login Popup */}
            <AuthPopup
                isOpen={showLoginPopup}
                onClose={() => {
                    setShowLoginPopup(false);
                    navigate('/');
                }}
                type="login"
                onAction={() => navigate('/user-login')}
            />

            {/* Aura Popup */}
            <AuthPopup
                isOpen={showAuraPopup}
                onClose={() => navigate('/collection')}
                type="aura"
                onAction={() => navigate('/aura-dashboard')}
            />
        </div>
    );
};

export default LetAIDecidePage;
