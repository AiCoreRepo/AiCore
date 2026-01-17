import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuraDisplayCard } from '@/components/ai-tryon/AuraDisplayCard';
import { AuraPromptDialog } from '@/components/aura/AuraPromptDialog';
import { getAura, getAIRecommendations, type RecommendationRequest, type RecommendationsResponse, type RecommendationItem } from '@/lib/api';
import { Sparkles, Heart, Star, Wand2, AlertCircle, Loader2 } from 'lucide-react';
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

const inspirationalQuotes = [
  { quote: 'Style is a way to say who you are without having to speak.', author: 'Rachel Zoe' },
  { quote: 'Fashion is about dressing according to what is fashionable. Style is more about being yourself.', author: 'Oscar de la Renta' },
  { quote: 'Elegance is not standing out, but being remembered.', author: 'Giorgio Armani' },
  { quote: 'Fashion fades, only style remains the same.', author: 'Coco Chanel' },
  { quote: 'The joy of dressing is an art.', author: 'John Galliano' }
];

const occasions = [
  { value: 'Formal', label: 'Formal', icon: '', description: 'Professional & Elegant' },
  { value: 'Party', label: 'Party', icon: '', description: 'Festive & Fun' },
  { value: 'Wedding', label: 'Wedding', icon: '', description: 'Traditional & Graceful' },
  { value: 'Casual luxury', label: 'Casual Luxury', icon: '', description: 'Relaxed & Refined' },
  { value: 'Resort', label: 'Resort', icon: '', description: 'Breezy & Comfortable' },
];

const LetAIDecidePage = () => {
  const navigate = useNavigate();
  const [aura, setAura] = useState<AuraData | null>(null);
  const [loadingAura, setLoadingAura] = useState(true);
  const [showAuraPrompt, setShowAuraPrompt] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuote] = useState(() => inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]);

  useEffect(() => {
    checkAuraStatus();
  }, []);

  const checkAuraStatus = async () => {
    try {
      setLoadingAura(true);
      const auraData = await getAura();
      setAura(auraData);
    } catch (error: any) {
      console.error('Error fetching Aura:', error);
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

  const handleGetRecommendations = async (occasion: string) => {
    if (!aura) {
      setShowAuraPrompt(true);
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
