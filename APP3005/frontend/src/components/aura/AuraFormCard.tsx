import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Wand2, Loader2, CheckCircle2, AlertCircle, Settings2, ArrowLeft } from "lucide-react";
import { PhotoUploadZone } from "./PhotoUploadZone";
import { BodyAttributesForm } from "./BodyAttributesForm";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { analyzeBodyImage, BodyAnalysisResult } from "@/lib/api";
import "./aura-styles.css";

interface BodyAttributes {
    height?: number;
    weight?: number;
    skinTone?: string;
    gender?: string;
    bodyShape?: string;
    ageRange?: string;
    hairStyle?: string;
}

interface AuraFormCardProps {
    onCreateAura: (photoFile: File, attributes: BodyAttributes) => void;
    isProcessing: boolean;
}

// Map AI response values to form options
const mapSkinTone = (aiValue: string | null | undefined): string => {
    if (!aiValue) return "";
    const lowerValue = aiValue.toLowerCase();

    // Direct matches for internal values
    if (["light", "medium", "dusky", "deep", "fair", "olive", "tan", "dark"].includes(lowerValue)) {
        return lowerValue;
    }

    const mapping: Record<string, string> = {
        "Light": "light",
        "Medium": "medium",
        "Dusky": "dusky",
        "Deep": "deep",
    };
    return mapping[aiValue] || "";
};

const mapBodyShape = (aiValue: string | null | undefined): string => {
    if (!aiValue) return "";

    // Normalize string for mapping
    const normalized = aiValue.toLowerCase().replace(/\s+/g, '_');

    // Direct matches for internal values
    if (["rectangle", "pear_shape", "apple_shape", "hourglass", "inverted_triangle", "athletic", "slim", "average", "curvy", "plus"].includes(normalized)) {
        return normalized;
    }

    const mapping: Record<string, string> = {
        "Rectangle": "rectangle",
        "Pear Shape": "pear_shape",
        "Apple Shape": "apple_shape",
        "Hourglass": "hourglass",
        "Inverted Triangle": "inverted_triangle",
    };
    return mapping[aiValue] || "";
};

type Step = "upload" | "confirm";

export const AuraFormCard = ({ onCreateAura, isProcessing }: AuraFormCardProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Step state
    const [currentStep, setCurrentStep] = useState<Step>("upload");

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [attributes, setAttributes] = useState<BodyAttributes>({});

    // AI Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<BodyAnalysisResult | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const handlePhotoSelect = (file: File, preview: string) => {
        setPhotoFile(file);
        setPhotoPreview(preview);
        // Reset analysis state for new photo
        setAnalysisResult(null);
        setAnalysisError(null);
    };

    const handlePhotoRemove = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setAnalysisResult(null);
        setAnalysisError(null);
        setAttributes({});
        setCurrentStep("upload");
    };

    // Proceed to Step 2 - analyze first if possible
    const handleProceedToConfirm = async () => {
        if (!photoFile) return;

        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
            console.log('🔍 Analyzing photo...');
            const result = await analyzeBodyImage(photoFile);
            setAnalysisResult(result);

            if (result.success) {
                // Auto-populate attributes from AI analysis
                setAttributes(prev => ({
                    ...prev,
                    skinTone: mapSkinTone(result.skinToneLabel) || prev.skinTone,
                    bodyShape: mapBodyShape(result.bodyShape) || prev.bodyShape,
                }));
                console.log('✅ AI detected:', result.skinToneLabel, result.bodyShape);
            } else {
                console.log('⚠️ Analysis failed, proceeding with manual entry');
                setAnalysisError(result.error || "Analysis unavailable");
            }
        } catch (error: any) {
            console.log('⚠️ Analysis error, proceeding with manual entry:', error.message);
            setAnalysisError("AI analysis unavailable - please fill manually");
        } finally {
            setIsAnalyzing(false);
            setCurrentStep("confirm"); // Always proceed to confirm step
        }
    };

    const handleBackToUpload = () => {
        setCurrentStep("upload");
    };

    const handleCreateAura = () => {
        if (photoFile) {
            console.log('🚀 Creating Aura with attributes:', attributes);
            onCreateAura(photoFile, attributes);
        }
    };

    const handleSkip = () => {
        navigate("/");
    };

    const isFormValid = photoFile !== null;

    return (
        <div className="w-full lg:w-1/2 flex flex-col bg-gradient-to-br from-cream via-ivory to-cream overflow-hidden">
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 lg:py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-xl"
                >
                    {/* Card Container - Golden Background */}
                    <div
                        className="bg-gradient-to-br from-gold/5 via-cream/80 to-gold/10 backdrop-blur-sm rounded-3xl shadow-2xl border border-gold/30 p-6 sm:p-8 lg:p-10 overflow-y-auto hide-scrollbar"
                        style={{ maxHeight: "85vh" }}
                    >
                        {/* Welcome Message */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mb-4"
                        >
                            <p className="text-sm text-charcoal/60 mb-1">
                                Welcome back,
                            </p>
                            <p className="text-lg font-bold bg-gradient-to-r from-gold via-gold to-charcoal bg-clip-text text-transparent">
                                {user?.email || "User"}
                            </p>
                        </motion.div>

                        {/* Step Indicator */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${currentStep === "upload"
                                ? "bg-gold text-charcoal"
                                : "bg-gold/20 text-charcoal/60"
                                }`}>
                                <span className="w-5 h-5 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold">1</span>
                                Upload Photo
                            </div>
                            <div className="w-8 h-0.5 bg-gold/30"></div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${currentStep === "confirm"
                                ? "bg-gold text-charcoal"
                                : "bg-gold/20 text-charcoal/60"
                                }`}>
                                <span className="w-5 h-5 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold">2</span>
                                Confirm & Create
                            </div>
                        </div>

                        {/* STEP 1: Upload Photo */}
                        <AnimatePresence mode="wait">
                            {currentStep === "upload" && (
                                <motion.div
                                    key="step-upload"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Title */}
                                    <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-3 leading-tight">
                                        Upload Your Photo
                                    </h1>

                                    <p className="text-sm text-charcoal/60 mb-6">
                                        We'll analyze your photo to detect your body attributes automatically.
                                    </p>

                                    {/* Photo Upload Zone */}
                                    <div className="mb-6">
                                        <PhotoUploadZone
                                            onPhotoSelect={handlePhotoSelect}
                                            photoPreview={photoPreview}
                                            onRemove={handlePhotoRemove}
                                        />
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        onClick={handleProceedToConfirm}
                                        disabled={!photoFile || isAnalyzing}
                                        className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-r from-gold via-[#D4B76E] to-gold transition-all duration-300 ${photoFile && !isAnalyzing ? 'opacity-100' : 'opacity-0'}`}></div>
                                        <div className={`absolute inset-0 bg-gray-200 ${photoFile && !isAnalyzing ? 'opacity-0' : 'opacity-100'}`}></div>

                                        {photoFile && !isAnalyzing && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        )}

                                        <div className="relative px-8 py-4 flex items-center justify-center gap-3">
                                            {isAnalyzing ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 text-charcoal animate-spin" />
                                                    <span className="font-bold text-base text-charcoal">Analyzing Photo...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Wand2 className={`w-5 h-5 transition-colors ${photoFile ? 'text-charcoal' : 'text-gray-500'}`} />
                                                    <span className={`font-bold text-base transition-colors ${photoFile ? 'text-charcoal' : 'text-gray-500'}`}>
                                                        Analyze & Continue
                                                    </span>
                                                    <ArrowRight className={`w-5 h-5 transition-all ${photoFile ? 'text-charcoal group-hover:translate-x-1' : 'text-gray-500'}`} />
                                                </>
                                            )}
                                        </div>

                                        {photoFile && !isAnalyzing && (
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-gold/40 blur-xl group-hover:bg-gold/60 transition-all"></div>
                                        )}
                                    </button>

                                    {/* Skip Button */}
                                    <button
                                        onClick={handleSkip}
                                        disabled={isAnalyzing}
                                        className="group w-full mt-4 px-8 py-3 rounded-2xl font-semibold text-sm border-2 border-gold/30 text-charcoal/70 hover:border-gold hover:text-charcoal hover:bg-gold/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span>Skip for now</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 2: Confirm Attributes & Create */}
                            {currentStep === "confirm" && (
                                <motion.div
                                    key="step-confirm"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Back Button */}
                                    <button
                                        onClick={handleBackToUpload}
                                        disabled={isProcessing}
                                        className="flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors mb-4"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Change Photo
                                    </button>

                                    {/* Title */}
                                    <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-3 leading-tight">
                                        Confirm Your Details
                                    </h1>

                                    <p className="text-sm text-charcoal/60 mb-6">
                                        {analysisResult?.success
                                            ? "We detected your attributes! Review and adjust if needed."
                                            : "Fill in your body attributes below."}
                                    </p>

                                    {/* AI Detection Results */}
                                    {analysisResult?.success && (
                                        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 mb-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                <span className="text-sm font-semibold text-emerald-700">AI Detected</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Skin Tone */}
                                                <div className="bg-white/80 rounded-xl p-3 border border-emerald-100">
                                                    <p className="text-xs text-charcoal/60 mb-1">Skin Tone</p>
                                                    <div className="flex items-center gap-2">
                                                        {analysisResult.skinHexes?.length > 0 && (
                                                            <div className="flex -space-x-1">
                                                                {analysisResult.skinHexes.slice(0, 3).map((hex, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                                                                        style={{ backgroundColor: hex }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-medium text-charcoal">
                                                            {analysisResult.skinToneLabel || "—"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Body Shape */}
                                                <div className="bg-white/80 rounded-xl p-3 border border-emerald-100">
                                                    <p className="text-xs text-charcoal/60 mb-1">Body Shape</p>
                                                    <p className="text-sm font-medium text-charcoal">
                                                        {analysisResult.bodyShape || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Analysis Error/Skip Message */}
                                    {analysisError && (
                                        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 mb-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                                <span className="text-sm font-semibold text-amber-700">Manual Entry Required</span>
                                            </div>
                                            <p className="text-xs text-amber-600">
                                                {analysisError}. Please fill in your details below.
                                            </p>
                                        </div>
                                    )}

                                    {/* Body Attributes Form */}
                                    <div className="mb-6">
                                        <BodyAttributesForm
                                            attributes={attributes}
                                            onChange={setAttributes}
                                        />
                                    </div>

                                    {/* Create Aura Button */}
                                    <button
                                        onClick={handleCreateAura}
                                        disabled={isProcessing}
                                        className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-r from-gold via-[#D4B76E] to-gold transition-all duration-300 ${!isProcessing ? 'opacity-100' : 'opacity-0'}`}></div>
                                        <div className={`absolute inset-0 bg-gray-200 ${!isProcessing ? 'opacity-0' : 'opacity-100'}`}></div>

                                        {!isProcessing && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        )}

                                        <div className="relative px-8 py-4 flex items-center justify-center gap-3">
                                            {isProcessing ? (
                                                <>
                                                    <Sparkles className="w-5 h-5 text-charcoal animate-spin" />
                                                    <span className="font-bold text-base text-charcoal">Creating Your Aura...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5 text-charcoal" />
                                                    <span className="font-bold text-base text-charcoal">
                                                        Confirm & Create Aura
                                                    </span>
                                                    <ArrowRight className="w-5 h-5 text-charcoal group-hover:translate-x-1 transition-all" />
                                                </>
                                            )}
                                        </div>

                                        {!isProcessing && (
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-gold/40 blur-xl group-hover:bg-gold/60 transition-all"></div>
                                        )}
                                    </button>

                                    {/* Helper Text */}
                                    <div className="mt-6 text-center">
                                        <p className="text-xs text-charcoal/50">
                                            ⏱️ Takes approximately 20 seconds to generate your personalized Aura
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
