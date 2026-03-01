import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Ruler, Palette, User } from "lucide-react";
import {
    SKIN_TONE_OPTIONS,
    BODY_SHAPE_OPTIONS,
    BODY_SIZE_OPTIONS
} from "@/constants/aura.constants";
import { BodyShapeGuideModal } from "./BodyShapeGuideModal";
import { SkinToneGuideModal } from "./SkinToneGuideModal";

interface BodyAttributes {
    height?: number;
    skinTone?: string;
    gender?: string;
    bodyShape?: string;
    bodySize?: string;
    ageRange?: string;
}

interface BodyAttributesFormProps {
    attributes: BodyAttributes;
    onChange: (attributes: BodyAttributes) => void;
}

export const BodyAttributesForm = ({ attributes, onChange }: BodyAttributesFormProps) => {
    const [showBodyShapeGuide, setShowBodyShapeGuide] = useState(false);
    const [showSkinToneGuide, setShowSkinToneGuide] = useState(false);

    const handleChange = (field: keyof BodyAttributes, value: string | number) => {
        onChange({ ...attributes, [field]: value });
    };

    const inputClass = `
        w-full pl-11 pr-4 py-3.5 rounded-xl 
        border-2 border-gold/30 
        bg-white/80 backdrop-blur-sm
        text-charcoal text-sm font-medium 
        focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold 
        transition-all duration-300 
        hover:border-gold/50 hover:bg-white/90 hover:shadow-md
        placeholder:text-charcoal/40
    `;

    const labelClass = "block text-xs font-bold text-charcoal/80 mb-2.5 uppercase tracking-wider";
    const guideHeaderLabelClass = "block text-xs font-bold text-charcoal/80 uppercase tracking-wider";
    const guideButtonClass = "flex items-center gap-1.5 px-3 py-1.5 text-xs text-gold hover:text-amber-600 transition-all group bg-gold/10 hover:bg-gold/20 rounded-lg";

    return (
        <div className="space-y-6">
            {/* Section Header with Gradient */}
            <div className="relative flex items-center gap-3 pb-4 mb-2">
                <div className="w-1.5 h-8 bg-gradient-to-b from-gold via-amber-400 to-gold rounded-full shadow-lg" />
                <h3 className="text-lg font-bold bg-gradient-to-r from-charcoal to-charcoal/70 bg-clip-text text-transparent">
                    Your Attributes
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent" />
            </div>

            {/* Height */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="relative"
            >
                <label className={labelClass}>Height (cm)</label>
                <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/70 pointer-events-none">
                        <Ruler className="w-5 h-5" />
                    </div>
                    <input
                        type="number"
                        min={100}
                        max={250}
                        step={1}
                        placeholder="Optional, e.g. 170"
                        value={attributes.height ?? ""}
                        onChange={(e) =>
                            onChange({
                                ...attributes,
                                height: e.target.value ? Number(e.target.value) : undefined,
                            })
                        }
                        className={inputClass}
                    />
                </div>
            </motion.div>

            {/* Body Shape */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
            >
                <div className="flex items-center justify-between mb-2.5">
                    <label className={guideHeaderLabelClass}>Body Shape</label>
                    <button
                        type="button"
                        onClick={() => setShowBodyShapeGuide(true)}
                        className={guideButtonClass}
                    >
                        <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold">Guide</span>
                    </button>
                </div>
                <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/70 pointer-events-none">
                        <User className="w-5 h-5" />
                    </div>
                    <select
                        value={attributes.bodyShape || ""}
                        onChange={(e) => handleChange("bodyShape", e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select Shape</option>
                        {BODY_SHAPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* Body Size */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative"
            >
                <label className={labelClass}>Body Size</label>
                <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/70 pointer-events-none">
                        <Ruler className="w-5 h-5" />
                    </div>
                    <select
                        value={attributes.bodySize || ""}
                        onChange={(e) => handleChange("bodySize", e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select Size</option>
                        {BODY_SIZE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* Skin Tone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
            >
                <div className="flex items-center justify-between mb-2.5">

                    <label className={guideHeaderLabelClass}>Skin Tone</label>
                    <button
                        type="button"
                        onClick={() => setShowSkinToneGuide(true)}
                        className={guideButtonClass}
                    >
                        <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold">Guide</span>
                    </button>
                    </div>
                <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/70 pointer-events-none">
                        <Palette className="w-5 h-5" />
                    </div>
                    <select
                        value={attributes.skinTone || ""}
                        onChange={(e) => handleChange("skinTone", e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select Tone</option>
                        {SKIN_TONE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* Visual Guide Modals */}
            <BodyShapeGuideModal
                isOpen={showBodyShapeGuide}
                onClose={() => setShowBodyShapeGuide(false)}
            />
            <SkinToneGuideModal
                isOpen={showSkinToneGuide}
                onClose={() => setShowSkinToneGuide(false)}
            />
        </div>
    );
};
