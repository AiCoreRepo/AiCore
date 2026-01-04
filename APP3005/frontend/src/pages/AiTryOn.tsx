import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuraDisplayCard } from '@/components/ai-tryon/AuraDisplayCard';
import { ClothingItemCard } from '@/components/ai-tryon/ClothingItemCard';
import { TryOnResultModal } from '@/components/ai-tryon/TryOnResultModal';
import { TryOnGalleryModal } from '@/components/ai-tryon/TryOnGalleryModal';
import { AuraPromptDialog } from '@/components/aura/AuraPromptDialog';
import { usePublicProducts } from '@/hooks/usePublicProducts';
import { getAura, tryOnWithGemini, tryOnWithVertex, generateMoreAngles, getTryOnHistory } from '@/lib/api';
import { Sparkles, AlertCircle, Images } from 'lucide-react';
import '@/components/ai-tryon/ai-tryon-styles.css';

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

const AiTryOn = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [aura, setAura] = useState<AuraData | null>(null);
  const [loadingAura, setLoadingAura] = useState(true);
  const [showAuraPrompt, setShowAuraPrompt] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [generatingAngles, setGeneratingAngles] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [tryOnHistory, setTryOnHistory] = useState<any[]>([]);

  // Fetch products
  const { data: productsData, isLoading: productsLoading, error: productsError } = usePublicProducts(1);

  // Check authentication and Aura status on mount
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Check if user is logged in
    if (!user) {
      console.log('❌ User not logged in, redirecting to login');
      navigate('/user-login');
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
      // User doesn't have Aura, show prompt
      setShowAuraPrompt(true);
    } finally {
      setLoadingAura(false);
    }
  };

  const handleAuraAccept = () => {
    setShowAuraPrompt(false);
    navigate('/aura-dashboard');
  };

  const handleAuraDecline = () => {
    setShowAuraPrompt(false);
    navigate('/collection');
  };

  const handleTryOn = async (productId: string, provider: 'gemini' | 'vertex' = 'vertex') => {
    if (!aura) {
      setShowAuraPrompt(true);
      return;
    }

    try {
      setSelectedProduct(productId);
      setCurrentProductId(productId); // Store productId for angle generation
      setTryOnLoading(true);
      setTryOnError(null);
      setShowResultModal(true);

      const tryOnFunction = provider === 'gemini' ? tryOnWithGemini : tryOnWithVertex;

      const result = await tryOnFunction({
        userId: aura.user_id,
        clothingItemId: productId,
      });

      if (result.success && result.resultImage) {
        // Ensure the image has the data URI prefix
        const imageData = result.resultImage.startsWith('data:')
          ? result.resultImage
          : `data:image/jpeg;base64,${result.resultImage}`;
        setResultImage(imageData);
      } else {
        throw new Error(result.message || 'Try-on failed');
      }
    } catch (error: any) {
      console.error('Try-on error:', error);
      setTryOnError(error.message || 'Failed to process try-on. Please try again.');
    } finally {
      setTryOnLoading(false);
      setSelectedProduct(null);
    }
  };

  const handleGenerateMoreAngles = async () => {
    if (!aura || !resultImage) return;

    try {
      setGeneratingAngles(true);
      setTryOnError(null);

      const result = await generateMoreAngles({
        userId: aura.user_id,
        productId: currentProductId!,
        previousImageUrl: resultImage,
      });

      if (result.success && result.resultImage) {
        const imageData = result.resultImage.startsWith('data:')
          ? result.resultImage
          : `data:image/jpeg;base64,${result.resultImage}`;
        setResultImage(imageData);
      } else {
        throw new Error(result.message || 'Failed to generate more angles');
      }
    } catch (error: any) {
      console.error('Generate angles error:', error);
      setTryOnError(error.message || 'Failed to generate more angles. Please try again.');
    } finally {
      setGeneratingAngles(false);
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    setResultImage(null);
    setTryOnError(null);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#F5F0E6',
      }}
    >
      <Navbar />

      <main className="pt-20 pb-12">
        {/* Header */}
        <section className="py-8 border-b border-gold/20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto relative">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-gold" />
                <h1 className="text-4xl md:text-5xl font-bold text-charcoal">
                  AI Virtual Try-On
                </h1>
              </div>
              <p className="text-lg text-charcoal/70">
                See how clothes look on your AI avatar before you buy
              </p>

              {/* Gallery Button - Top Right */}
              <button
                onClick={() => {
                  console.log('Gallery button clicked!');
                  getTryOnHistory()
                    .then((history) => {
                      console.log('Got history:', history);
                      setTryOnHistory(history.tryOns || []);
                      setShowGallery(true);
                    })
                    .catch((error) => {
                      console.error('Failed to load gallery:', error);
                      alert('Failed to load gallery: ' + error.message);
                    });
                }}
                className="absolute top-0 right-0 flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.05]"
                style={{
                  background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.95) 0%, rgba(201, 165, 92, 1) 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(201, 165, 92, 0.3)',
                }}
              >
                <Images className="w-5 h-5" />
                My Gallery
              </button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Loading State */}
            {loadingAura && (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gold border-t-transparent mb-4" />
                <p className="text-charcoal/70">Loading your Aura...</p>
              </div>
            )}

            {/* Main Layout */}
            {!loadingAura && aura && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Sidebar - Aura Display */}
                <div className="lg:col-span-1">
                  <AuraDisplayCard aura={aura} />
                </div>

                {/* Right Content - Clothing Grid */}
                <div className="lg:col-span-3">
                  {/* Products Loading */}
                  {productsLoading && (
                    <div className="text-center py-20">
                      <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gold border-t-transparent mb-4" />
                      <p className="text-charcoal/70">Loading clothing items...</p>
                    </div>
                  )}

                  {/* Products Error */}
                  {productsError && (
                    <div
                      className="p-8 rounded-2xl text-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.15) 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-charcoal font-medium">
                        Failed to load clothing items. Please try again later.
                      </p>
                    </div>
                  )}

                  {/* Products Grid */}
                  {!productsLoading && !productsError && productsData?.products && (
                    <>
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-charcoal mb-2">
                          Choose an Outfit to Try On
                        </h2>
                        <p className="text-charcoal/60">
                          {productsData.products.length} items available
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {productsData.products.map((product: any) => (
                          <ClothingItemCard
                            key={product.product_id}
                            product={product}
                            onTryOnGemini={() => handleTryOn(product.product_id, 'gemini')}
                            onTryOnVertex={() => handleTryOn(product.product_id, 'vertex')}
                            loading={selectedProduct === product.product_id && tryOnLoading}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Aura Prompt Dialog */}
      <AuraPromptDialog
        isOpen={showAuraPrompt}
        onAccept={handleAuraAccept}
        onDecline={handleAuraDecline}
      />

      {/* Try-On Result Modal */}
      <TryOnResultModal
        isOpen={showResultModal}
        onClose={closeResultModal}
        resultImage={resultImage}
        loading={tryOnLoading}
        error={tryOnError}
        onGenerateMoreAngles={handleGenerateMoreAngles}
        generatingAngles={generatingAngles}
      />

      {/* Gallery Modal */}
      <TryOnGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        tryOns={tryOnHistory}
      />
    </div>
  );
};

export default AiTryOn;
