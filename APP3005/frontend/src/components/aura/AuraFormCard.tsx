import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Wand2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { PhotoUploadZone } from "./PhotoUploadZone";
import { BodyAttributesForm } from "./BodyAttributesForm";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { analyzeBodyImage, BodyAnalysisResult } from "@/lib/api";
import { SKIN_TONE_OPTIONS, BODY_SHAPE_OPTIONS } from "@/constants/aura.constants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import "./aura-styles.css";

interface BodyAttributes {
    height?: number;
    skinTone?: string;
    gender?: string;
    bodyShape?: string;
    bodySize?: string;
    ageRange?: string;
}

type RequiredBodyAttribute = "bodyShape" | "bodySize" | "skinTone";

interface AuraFormCardProps {
    onCreateAura: (photoFile: File, attributes: BodyAttributes) => void;
    isProcessing: boolean;
    prefilledDob?: string;
}

// Map AI response values to form options
const mapSkinTone = (aiValue: string | null | undefined): string => {
    if (!aiValue) return "";
    const lowerValue = aiValue.toLowerCase();

    // Direct matches for internal values from constants
    const validValues = SKIN_TONE_OPTIONS.map(opt => opt.value);
    if (validValues.includes(lowerValue)) {
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

    // Direct matches for internal values from constants
    const validValues = BODY_SHAPE_OPTIONS.map(opt => opt.value);
    if (validValues.includes(normalized)) {
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

const PARTIAL_BODY_TOAST_MESSAGE =
    "We couldn’t fully detect your body shape from this photo. Please fill in the missing details manually below.";

const REQUIRED_ATTRIBUTE_MESSAGES: Record<RequiredBodyAttribute, string> = {
    bodyShape: "Select your body shape.",
    bodySize: "Select your body size.",
    skinTone: "Select your skin tone.",
};

const formatDobForInput = (value?: string): string => {
    if (!value) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return `${day}/${month}/${year}`;
    }

    return value;
};

const normalizeDobInput = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseDobDate = (value: string): Date | null => {
    const trimmed = value.trim();

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));

        if (
            parsed.getFullYear() !== Number(year) ||
            parsed.getMonth() + 1 !== Number(month) ||
            parsed.getDate() !== Number(day)
        ) {
            return null;
        }

        return parsed;
    }

    const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!slashMatch) return null;

    const [, day, month, year] = slashMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));

    if (
        parsed.getFullYear() !== Number(year) ||
        parsed.getMonth() + 1 !== Number(month) ||
        parsed.getDate() !== Number(day)
    ) {
        return null;
    }

    return parsed;
};

const parseDobInput = (value: string): string | null => {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return parseDobDate(trimmed) ? trimmed : null;
    }

    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const [, day, month, year] = match;
    return parseDobDate(trimmed) ? `${year}-${month}-${day}` : null;
};

const getDobStorageKey = (email?: string) =>
    email ? `aivestire:dob:${email.toLowerCase()}` : "";

const getStoredDob = (email?: string): string => {
    if (!email) return "";
    const key = getDobStorageKey(email);
    return key ? localStorage.getItem(key) || "" : "";
};

const setStoredDob = (email: string, dob: string): void => {
    const key = getDobStorageKey(email);
    if (key) {
        localStorage.setItem(key, dob);
    }
};

// Helper to determine age range from DOB
const calculateAgeRangeFromDob = (dobString?: string): string => {
    if (!dobString) return "";

    const birthDate = parseDobDate(dobString);
    if (!birthDate) return "";

    // Calculate Age
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    // Map to Ranges
    if (age >= 13 && age <= 17) return "13-17";
    if (age >= 18 && age <= 25) return "18-25";
    if (age >= 26 && age <= 35) return "26-35";
    if (age >= 36 && age <= 50) return "36-50";
    if (age >= 51) return "51+";

    return ""; // Fallback or under 13
};

export const AuraFormCard = ({ onCreateAura, isProcessing, prefilledDob }: AuraFormCardProps) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const requiresDobCollection = Boolean(user?.needs_dob_collection);
    const initialDobValue = prefilledDob || user?.dob || "";

    // Step state
    const [currentStep, setCurrentStep] = useState<Step>("upload");

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [attributes, setAttributes] = useState<BodyAttributes>({ gender: "female" });
    const [dob, setDob] = useState<string>(initialDobValue);
    const [dobInput, setDobInput] = useState<string>(formatDobForInput(initialDobValue));
    const [dobError, setDobError] = useState<string>("");
    const [showDobDialog, setShowDobDialog] = useState(false);
    const [attributeErrors, setAttributeErrors] = useState<Partial<Record<RequiredBodyAttribute, string>>>({});

    // AI Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<BodyAnalysisResult | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    useEffect(() => {
        if (!prefilledDob) return;

        setDob(prefilledDob);
        setDobInput(formatDobForInput(prefilledDob));
        const calculatedRange = calculateAgeRangeFromDob(prefilledDob);
        if (calculatedRange) {
            setAttributes(prev => ({ ...prev, ageRange: calculatedRange, gender: "female" }));
        }
    }, [prefilledDob]);

    useEffect(() => {
        if (!user?.email) return;

        const initialDob = user?.dob || prefilledDob || getStoredDob(user.email);
        if (initialDob) {
            setDob(initialDob);
            setDobInput(formatDobForInput(initialDob));
            const calculatedRange = calculateAgeRangeFromDob(initialDob);
            if (calculatedRange) {
                setAttributes(prev => ({ ...prev, ageRange: calculatedRange, gender: "female" }));
            }
        }
    }, [prefilledDob, user?.dob, user?.email]);

    useEffect(() => {
        const effectiveDob = dob || prefilledDob || (user?.email ? getStoredDob(user.email) : "");
        if (currentStep === "confirm" && !loading && requiresDobCollection && !effectiveDob) {
            setDobInput("");
            setDobError("");
            setShowDobDialog(true);
        }
    }, [currentStep, dob, loading, prefilledDob, requiresDobCollection, user?.email]);

    const handlePhotoSelect = (file: File, preview: string) => {
        setPhotoFile(file);
        setPhotoPreview(preview);
        // Reset analysis state for new photo
        setAnalysisResult(null);
        setAnalysisError(null);
        setAttributeErrors({});

        // Auto-populate age range and default gender.
        const calculatedRange = calculateAgeRangeFromDob(dob);
        if (calculatedRange) {
            setAttributes(prev => ({
                ...prev,
                ageRange: calculatedRange,
                gender: "female",
            }));
        }
    };

    const handlePhotoRemove = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setAnalysisResult(null);
        setAnalysisError(null);
        setAttributeErrors({});
        setAttributes({ gender: "female" });
        setCurrentStep("upload");
    };

    const getRequiredAttributeErrors = (values: BodyAttributes) => {
        const nextErrors: Partial<Record<RequiredBodyAttribute, string>> = {};

        (Object.keys(REQUIRED_ATTRIBUTE_MESSAGES) as RequiredBodyAttribute[]).forEach((field) => {
            if (!values[field]) {
                nextErrors[field] = REQUIRED_ATTRIBUTE_MESSAGES[field];
            }
        });

        return nextErrors;
    };

    const handleAttributesChange = (nextAttributes: BodyAttributes) => {
        setAttributes(nextAttributes);
        setAttributeErrors((prev) => {
            if (Object.keys(prev).length === 0) {
                return prev;
            }

            const nextErrors = { ...prev };
            (Object.keys(nextErrors) as RequiredBodyAttribute[]).forEach((field) => {
                if (nextAttributes[field]) {
                    delete nextErrors[field];
                }
            });
            return nextErrors;
        });
    };

    // Proceed to Step 2 - analyze first if possible
    const handleProceedToConfirm = async () => {
        if (!photoFile) return;

        setIsAnalyzing(true);
        setAnalysisError(null);

        // Failsafe timeout - if analysis takes more than 35 seconds, force proceed
        const failsafeTimeout = setTimeout(() => {
            console.warn('⚠️ Failsafe timeout triggered - forcing step transition');
            setIsAnalyzing(false);
            setCurrentStep("confirm");
        }, 35000);

        try {
            console.log('🔍 Analyzing photo...');
            const result = await analyzeBodyImage(photoFile);
            console.log('📊 Analysis result:', result);
            setAnalysisResult(result);

            if (result.success) {
                const mappedSkinTone = mapSkinTone(result.skinToneLabel);
                const mappedBodyShape = result.fullBody ? mapBodyShape(result.bodyShape) : "";

                // Auto-populate attributes from AI analysis
                setAttributes(prev => ({
                    ...prev,
                    skinTone: mappedSkinTone || prev.skinTone,
                    bodyShape: result.fullBody ? (mappedBodyShape || prev.bodyShape) : "",
                    ageRange: prev.ageRange || calculateAgeRangeFromDob(dob),
                    gender: "female",
                }));

                if (!result.fullBody) {
                    setAnalysisError(PARTIAL_BODY_TOAST_MESSAGE);
                    console.log('⚠️ Partial body photo uploaded, body shape left for manual entry');
                } else {
                    console.log('✅ AI detected:', result.skinToneLabel, result.bodyShape);
                }
            } else {
                console.log('⚠️ Analysis failed, proceeding with manual entry');
                setAnalysisError(result.error || "Analysis unavailable");
                // Ensure age range is still populated even if analysis fails
                const ageRange = calculateAgeRangeFromDob(dob);
                if (ageRange) {
                    setAttributes(prev => ({ ...prev, ageRange, gender: "female" }));
                }
            }
        } catch (error: any) {
            console.log('⚠️ Analysis error, proceeding with manual entry:', error.message);
            setAnalysisError("AI analysis unavailable - please fill manually");
            // Ensure age range is still populated
            const ageRange = calculateAgeRangeFromDob(dob);
            if (ageRange) {
                setAttributes(prev => ({ ...prev, ageRange, gender: "female" }));
            }
        } finally {
            clearTimeout(failsafeTimeout);
            console.log('🎯 Transitioning to confirm step');
            setIsAnalyzing(false);
            setCurrentStep("confirm");
        }
    };

    const handleBackToUpload = () => {
        setCurrentStep("upload");
    };

    const handleCreateAura = () => {
        if (!photoFile) return;

        const missingRequiredAttributeErrors = getRequiredAttributeErrors(attributes);
        if (Object.keys(missingRequiredAttributeErrors).length > 0) {
            setAttributeErrors(missingRequiredAttributeErrors);
            return;
        }

        const effectiveDob = dob || prefilledDob || (user?.email ? getStoredDob(user.email) : "");

        if (requiresDobCollection && !effectiveDob) {
            setShowDobDialog(true);
            return;
        }

        const calculatedAgeRange = calculateAgeRangeFromDob(effectiveDob);
        if (requiresDobCollection && !calculatedAgeRange) {
            setDobError("Please enter a valid date of birth.");
            setShowDobDialog(true);
            return;
        }

        const finalAttributes: BodyAttributes = {
            ...attributes,
            gender: "female",
            ageRange: calculatedAgeRange,
        };

        console.log('🚀 Creating Aura with attributes:', finalAttributes);
        onCreateAura(photoFile, finalAttributes);
    };

    const handleDobSave = () => {
        if (!dobInput) {
            setDobError("Date of birth is required.");
            return;
        }

        const parsedDob = parseDobInput(dobInput);
        if (!parsedDob) {
            setDobError("Please enter date of birth in DD/MM/YYYY format.");
            return;
        }

        const birthDate = parseDobDate(parsedDob);
        const today = new Date();
        if (!birthDate || birthDate > today) {
            setDobError("Please enter a valid date of birth.");
            return;
        }

        const calculatedRange = calculateAgeRangeFromDob(parsedDob);
        if (!calculatedRange) {
            setDobError("You must be at least 13 years old.");
            return;
        }

        setDob(parsedDob);
        setDobInput(formatDobForInput(parsedDob));
        setDobError("");
        setShowDobDialog(false);
        setAttributes(prev => ({ ...prev, ageRange: calculatedRange, gender: "female" }));

        if (user?.email) {
            setStoredDob(user.email, parsedDob);
        }
    };

    const handleSkip = () => {
        navigate("/");
    };

    const hasAttributeErrors = Object.keys(attributeErrors).length > 0;

    return (
        <div className="flex min-h-[100dvh] w-full flex-1 flex-col bg-gradient-to-br from-cream via-ivory to-cream overflow-x-hidden lg:min-h-0 lg:w-1/2 lg:overflow-hidden">
            <div className="flex min-h-[100dvh] flex-1 items-stretch justify-center px-3 py-4 sm:px-6 sm:py-6 lg:min-h-0 lg:items-center lg:py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex w-full max-w-xl self-stretch lg:self-auto"
                >
                    {/* Card Container - Enhanced Premium Design */}
                    <div className="relative flex-1">
                        {/* Decorative Corner Elements */}
                        <div className="absolute -top-1 -left-1 w-20 h-20 bg-gradient-to-br from-gold/20 to-transparent rounded-tl-3xl blur-xl" />
                        <div className="absolute -bottom-1 -right-1 w-20 h-20 bg-gradient-to-tl from-gold/20 to-transparent rounded-br-3xl blur-xl" />

                        <div
                            className="relative flex h-full flex-col overflow-y-auto rounded-[28px] border-2 border-gold/40 bg-gradient-to-br from-white/95 via-cream/90 to-gold/10 p-4 shadow-2xl backdrop-blur-xl hide-scrollbar sm:rounded-3xl sm:p-8 lg:h-auto lg:max-h-[88dvh] lg:p-10"
                            style={{
                                boxShadow: '0 20px 60px rgba(201, 165, 95, 0.25), 0 0 40px rgba(201, 165, 95, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                            }}
                        >
                            {/* Inner Glow */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/50 via-transparent to-transparent pointer-events-none" />

                            {/* Welcome Message with Sparkles */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="relative mb-4 sm:mb-5"
                            >
                                {/* Sparkle Decorations */}
                                <motion.span
                                    className="absolute -left-2 -top-1 text-gold/60 text-lg"
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 180, 360]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    ✨
                                </motion.span>
                                <motion.span
                                    className="absolute -right-2 top-0 text-gold/60 text-sm"
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        rotate: [0, -180, -360]
                                    }}
                                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                                >
                                    ✨
                                </motion.span>

                                <p className="text-xs sm:text-sm text-charcoal/60 mb-1 font-medium">
                                    Welcome back,
                                </p>
                                <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gold via-amber-500 to-gold bg-clip-text text-transparent animate-gradient break-all sm:break-normal">
                                    {user?.email || "User"}
                                </p>
                            </motion.div>

                            {/* Enhanced Step Indicator */}
                            <div className="relative mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:gap-3">
                                {/* Step 1 */}
                                <motion.div
                                    className={`relative flex w-full items-center justify-between gap-2.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-500 sm:w-auto sm:justify-start ${currentStep === "upload"
                                        ? "bg-gradient-to-r from-gold via-amber-400 to-gold text-charcoal shadow-lg"
                                        : "bg-gradient-to-r from-gold/20 to-gold/10 text-charcoal/60"
                                        }`}
                                    animate={{
                                        boxShadow: currentStep === "upload"
                                            ? ['0 4px 20px rgba(201, 165, 95, 0.4)', '0 4px 30px rgba(201, 165, 95, 0.6)', '0 4px 20px rgba(201, 165, 95, 0.4)']
                                            : '0 2px 8px rgba(201, 165, 95, 0.1)'
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep === "upload"
                                        ? "bg-white text-gold shadow-md"
                                        : "bg-white/40 text-charcoal/60"
                                        }`}>
                                        1
                                    </span>
                                    <span>Upload Photo</span>
                                </motion.div>

                                {/* Connecting Line with Gradient */}
                                <div className="relative hidden h-1 max-w-[40px] flex-1 overflow-hidden rounded-full bg-gold/20 sm:block">
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-gold to-amber-400"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: currentStep === "confirm" ? 1 : 0 }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        style={{ transformOrigin: 'left' }}
                                    />
                                </div>

                                {/* Step 2 */}
                                <motion.div
                                    className={`relative flex w-full items-center justify-between gap-2.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-500 sm:w-auto sm:justify-start ${currentStep === "confirm"
                                        ? "bg-gradient-to-r from-gold via-amber-400 to-gold text-charcoal shadow-lg"
                                        : "bg-gradient-to-r from-gold/20 to-gold/10 text-charcoal/60"
                                        }`}
                                    animate={{
                                        boxShadow: currentStep === "confirm"
                                            ? ['0 4px 20px rgba(201, 165, 95, 0.4)', '0 4px 30px rgba(201, 165, 95, 0.6)', '0 4px 20px rgba(201, 165, 95, 0.4)']
                                            : '0 2px 8px rgba(201, 165, 95, 0.1)'
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep === "confirm"
                                        ? "bg-white text-gold shadow-md"
                                        : "bg-white/40 text-charcoal/60"
                                        }`}>
                                        2
                                    </span>
                                    <span>Confirm & Create</span>
                                </motion.div>
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
                                        <h1 className="mb-3 text-[1.9rem] font-serif leading-tight text-charcoal sm:text-3xl md:text-4xl">
                                            Upload Your Photo
                                        </h1>

                                        <p className="mb-5 text-sm text-charcoal/60 sm:mb-6">
                                            We'll analyze your photo to detect your body attributes automatically.
                                        </p>

                                        {/* Photo Upload Zone */}
                                        <div className="mb-5 sm:mb-6">
                                            <PhotoUploadZone
                                                onPhotoSelect={handlePhotoSelect}
                                                photoPreview={photoPreview}
                                                onRemove={handlePhotoRemove}
                                            />
                                        </div>

                                        <div className="sticky bottom-0 z-10 -mx-4 mt-6 bg-gradient-to-t from-[#fffdf8] via-[#fffdf8]/95 to-transparent px-4 pb-1 pt-4 sm:static sm:mx-0 sm:bg-none sm:px-0 sm:pb-0 sm:pt-0">
                                            {/* Enhanced Next Button */}
                                            <button
                                                onClick={handleProceedToConfirm}
                                                disabled={!photoFile || isAnalyzing}
                                                className={`group relative w-full overflow-hidden rounded-2xl transition-all duration-300 ${isAnalyzing ? '' : 'disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]'}`}
                                                style={{
                                                    boxShadow: isAnalyzing
                                                        ? '0 8px 30px rgba(201, 165, 95, 0.5), 0 4px 15px rgba(201, 165, 95, 0.3)'
                                                        : photoFile
                                                            ? '0 8px 24px rgba(201, 165, 95, 0.35), 0 4px 12px rgba(201, 165, 95, 0.2)'
                                                            : '0 2px 8px rgba(0, 0, 0, 0.1)'
                                                }}
                                            >
                                                {/* Background layers */}
                                                {isAnalyzing ? (
                                                    <>
                                                        {/* Golden animated gradient background when analyzing */}
                                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-gold to-amber-400 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]"></div>
                                                        {/* Sweep shimmer effect */}
                                                        <motion.div
                                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                            animate={{ x: ['-100%', '100%'] }}
                                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className={`absolute inset-0 bg-gradient-to-br from-gold via-amber-400 to-gold transition-all duration-300 ${photoFile ? 'opacity-100' : 'opacity-0'}`}></div>
                                                        <div className={`absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 ${photoFile ? 'opacity-0' : 'opacity-100'}`}></div>
                                                        {/* Top Highlight for 3D Effect */}
                                                        {photoFile && (
                                                            <div className="absolute top-0 inset-x-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/40 to-transparent" />
                                                        )}
                                                        {/* Shine Animation */}
                                                        {photoFile && (
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                                        )}
                                                    </>
                                                )}

                                                <div className="relative flex items-center justify-center gap-3 px-6 py-3.5 sm:px-8 sm:py-4">
                                                    {isAnalyzing ? (
                                                        <>
                                                            {/* Animated scanning icon */}
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                            >
                                                                <Wand2 className="h-5 w-5 text-charcoal" />
                                                            </motion.div>
                                                            <span className="text-sm font-bold text-charcoal sm:text-base">Analyzing Photo</span>
                                                            {/* Bouncing dots */}
                                                            <div className="flex h-5 items-end gap-1">
                                                                {[0, 1, 2].map(i => (
                                                                    <motion.span
                                                                        key={i}
                                                                        className="h-1.5 w-1.5 rounded-full bg-charcoal"
                                                                        animate={{ y: [0, -6, 0] }}
                                                                        transition={{
                                                                            duration: 0.6,
                                                                            repeat: Infinity,
                                                                            delay: i * 0.15,
                                                                            ease: 'easeInOut',
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Wand2 className={`h-5 w-5 transition-all ${photoFile ? 'text-charcoal group-hover:rotate-12' : 'text-gray-500'}`} />
                                                            <span className={`text-sm font-bold transition-colors sm:text-base ${photoFile ? 'text-charcoal' : 'text-gray-500'}`}>
                                                                Analyze & Continue
                                                            </span>
                                                            <ArrowRight className={`h-5 w-5 transition-all ${photoFile ? 'text-charcoal group-hover:translate-x-1' : 'text-gray-500'}`} />
                                                        </>
                                                    )}
                                                </div>

                                                {/* Progress bar at bottom when analyzing */}
                                                {isAnalyzing && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden bg-black/10">
                                                        <motion.div
                                                            className="h-full rounded-full bg-charcoal/60"
                                                            initial={{ width: '0%', x: '0%' }}
                                                            animate={{ width: ['0%', '40%', '20%', '70%', '40%', '100%'], x: ['0%', '10%', '30%', '10%', '40%', '0%'] }}
                                                            transition={{ duration: 8, ease: 'easeInOut' }}
                                                        />
                                                    </div>
                                                )}

                                                {/* Enhanced Glow Effect - only when not analyzing */}
                                                {photoFile && !isAnalyzing && (
                                                    <motion.div
                                                        className="absolute -bottom-2 left-1/2 h-4 w-3/4 -translate-x-1/2 rounded-full bg-gold/50 blur-2xl"
                                                        animate={{
                                                            opacity: [0.5, 0.8, 0.5],
                                                            scale: [1, 1.1, 1]
                                                        }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    />
                                                )}

                                                {/* Pulsing glow when analyzing */}
                                                {isAnalyzing && (
                                                    <motion.div
                                                        className="absolute -bottom-2 left-1/2 h-6 w-full -translate-x-1/2 rounded-full bg-gold/60 blur-2xl"
                                                        animate={{
                                                            opacity: [0.4, 0.8, 0.4],
                                                            scale: [0.9, 1.1, 0.9]
                                                        }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                    />
                                                )}
                                            </button>

                                            {/* Skip Button */}
                                            <button
                                                onClick={handleSkip}
                                                disabled={isAnalyzing}
                                                className="group mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gold/30 px-6 py-3 font-semibold text-sm text-charcoal/70 transition-all duration-300 hover:border-gold hover:bg-gold/5 hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-50 sm:mt-4 sm:px-8"
                                            >
                                                <span>Skip for now</span>
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </button>
                                        </div>
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
                                        <h1 className="mb-3 text-[1.9rem] font-serif leading-tight text-charcoal sm:text-3xl md:text-4xl">
                                            Confirm Your Details
                                        </h1>

                                        <p className="mb-5 text-sm text-charcoal/60 sm:mb-6">
                                            {analysisResult?.success && analysisResult?.fullBody
                                                ? "We detected your attributes! Review and adjust if needed."
                                                : "Fill in your body attributes below."}
                                        </p>

                                        {requiresDobCollection && !dob && !prefilledDob && (
                                            <div className="bg-amber-50/60 border border-amber-300 rounded-2xl p-4 mb-6">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-xs text-amber-700">
                                                        Date of birth is required to calculate age range.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDobInput(formatDobForInput(dob));
                                                            setDobError("");
                                                            setShowDobDialog(true);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-amber-200/70 hover:bg-amber-300/70 text-amber-900 text-xs font-semibold transition-colors"
                                                    >
                                                        Add DOB
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Detection Results */}
                                        {analysisResult?.success && (
                                            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 mb-6">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                    <span className="text-sm font-semibold text-emerald-700">
                                                        {analysisResult.fullBody ? "AI Detected" : "Partial AI Detection"}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                                            {analysisResult.fullBody
                                                                ? (analysisResult.bodyShape || "—")
                                                                : "Full-body photo required"}
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
                                                    <span className="text-sm font-semibold text-amber-700">
                                                        {analysisResult?.success && !analysisResult?.fullBody
                                                            ? "Manual input needed"
                                                            : "Manual Entry Required"}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-amber-600">
                                                    {analysisError}. Please fill in your details below.
                                                </p>
                                            </div>
                                        )}

                                        {hasAttributeErrors && (
                                            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 sm:mb-6">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                                                    Complete required fields
                                                </p>
                                                <p className="mt-1 text-sm leading-6 text-rose-700/90">
                                                    Add body shape, body size, and skin tone before creating your Aura.
                                                </p>
                                            </div>
                                        )}

                                        {/* Body Attributes Form */}
                                        <div className="mb-5 sm:mb-6">
                                            <BodyAttributesForm
                                                attributes={attributes}
                                                onChange={handleAttributesChange}
                                                errors={attributeErrors}
                                            />
                                        </div>

                                        <div className="mt-6 rounded-[24px] border border-gold/15 bg-white/70 px-4 py-4 shadow-[0_14px_32px_rgba(201,165,95,0.08)] sm:mt-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
                                            {/* Create Aura Button */}
                                            <button
                                                onClick={handleCreateAura}
                                                disabled={isProcessing}
                                                className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-r from-gold via-[#D4B76E] to-gold transition-all duration-300 ${!isProcessing ? 'opacity-100' : 'opacity-0'}`}></div>
                                                <div className={`absolute inset-0 bg-gray-200 ${!isProcessing ? 'opacity-0' : 'opacity-100'}`}></div>

                                                {!isProcessing && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"></div>
                                                )}

                                                <div className="relative flex items-center justify-center gap-3 px-6 py-3.5 sm:px-8 sm:py-4">
                                                    {isProcessing ? (
                                                        <>
                                                            <Sparkles className="h-5 w-5 animate-spin text-charcoal" />
                                                            <span className="text-sm font-bold text-charcoal sm:text-base">Creating Your Aura...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="h-5 w-5 text-charcoal" />
                                                            <span className="text-sm font-bold text-charcoal sm:text-base">
                                                                Confirm & Create Aura
                                                            </span>
                                                            <ArrowRight className="h-5 w-5 text-charcoal transition-all group-hover:translate-x-1" />
                                                        </>
                                                    )}
                                                </div>

                                                {!isProcessing && (
                                                    <div className="absolute -bottom-1 left-1/2 h-3 w-3/4 -translate-x-1/2 bg-gold/40 blur-xl transition-all group-hover:bg-gold/60"></div>
                                                )}
                                            </button>

                                            {/* Helper Text */}
                                            <div className="mt-4 text-center sm:mt-6">
                                                <p className="text-xs text-charcoal/50">
                                                    ⏱️ Takes approximately 20 seconds to generate your personalized Aura
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>

            <Dialog open={showDobDialog} onOpenChange={setShowDobDialog}>
                <DialogContent className="max-w-md bg-white border-gold/30">
                    <DialogHeader>
                        <DialogTitle className="text-charcoal">Enter Date of Birth</DialogTitle>
                        <DialogDescription className="text-charcoal/70">
                            We use this to calculate your age range for better Aura matching.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="DD/MM/YYYY"
                            maxLength={10}
                            value={dobInput}
                            onChange={(event) => {
                                setDobInput(normalizeDobInput(event.target.value));
                                setDobError("");
                            }}
                            className="text-charcoal"
                        />
                        {dobError && <p className="text-xs text-red-600">{dobError}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDobDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDobSave}
                            className="bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black"
                        >
                            Save DOB
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
