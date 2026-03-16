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

type RequiredBodyAttribute = "bodyShape" | "bodySize" | "skinTone";

interface BodyAttributesFormProps {
    attributes: BodyAttributes;
    onChange: (attributes: BodyAttributes) => void;
    errors?: Partial<Record<RequiredBodyAttribute, string>>;
}

export const BodyAttributesForm = ({ attributes, onChange, errors = {} }: BodyAttributesFormProps) => {
    const [showBodyShapeGuide, setShowBodyShapeGuide] = useState(false);
    const [showSkinToneGuide, setShowSkinToneGuide] = useState(false);

    const handleChange = (field: keyof BodyAttributes, value: string | number) => {
        onChange({ ...attributes, [field]: value });
    };

    const inputClass = `
        w-full rounded-xl pl-10 pr-4 py-3 sm:pl-11 sm:py-3.5
        border-2 border-gold/30 
        bg-white/80 backdrop-blur-sm
        text-charcoal text-sm font-medium 
        focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold 
        transition-all duration-300 
        hover:border-gold/50 hover:bg-white/90 hover:shadow-md
        placeholder:text-charcoal/40
    `;

    const labelClass = "mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/80 sm:mb-2.5 sm:text-xs";
    const guideHeaderLabelClass = "block text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/80 sm:text-xs";
    const guideButtonClass = "group flex items-center gap-1.5 rounded-lg bg-gold/10 px-2.5 py-1.5 text-[11px] text-gold transition-all hover:bg-gold/20 hover:text-amber-600 sm:px-3 sm:text-xs";
    const requiredBadgeClass = "rounded-full bg-[#F6E5C5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A6936]";
    const errorClass = "border-rose-300 bg-rose-50/80 focus:border-rose-400 focus:ring-rose-100 hover:border-rose-300";

    const getInputClass = (field?: RequiredBodyAttribute) =>
        `${inputClass} ${field && errors[field] ? errorClass : ""}`;

    const renderFieldError = (field: RequiredBodyAttribute) =>
        errors[field] ? (
            <p className="mt-2 text-xs font-medium text-rose-600">{errors[field]}</p>
        ) : null;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Section Header with Gradient */}
            <div className="relative mb-1 flex items-center gap-2.5 pb-3 sm:mb-2 sm:gap-3 sm:pb-4">
                <div className="h-7 w-1.5 rounded-full bg-gradient-to-b from-gold via-amber-400 to-gold shadow-lg sm:h-8" />
                <h3 className="text-base font-bold bg-gradient-to-r from-charcoal to-charcoal/70 bg-clip-text text-transparent sm:text-lg">
                    Your Attributes
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent" />
            </div>

            <div className="rounded-2xl border border-gold/25 bg-white/70 px-4 py-3 shadow-[0_12px_28px_rgba(201,165,95,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6936]">
                    Required To Continue
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <span className={requiredBadgeClass}>Body Shape</span>
                    <span className={requiredBadgeClass}>Body Size</span>
                    <span className={requiredBadgeClass}>Skin Tone</span>
                </div>
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
                        className={getInputClass()}
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
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-2.5">
                    <div className="flex items-center gap-2">
                        <label className={guideHeaderLabelClass}>Body Shape</label>
                        <span className={requiredBadgeClass}>Required</span>
                    </div>
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
                        className={getInputClass("bodyShape")}
                    >
                        <option value="">Select Shape</option>
                        {BODY_SHAPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                {renderFieldError("bodyShape")}
            </motion.div>

            {/* Body Size */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative"
            >
                <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
                    <label className={guideHeaderLabelClass}>Body Size</label>
                    <span className={requiredBadgeClass}>Required</span>
                </div>
                <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/70 pointer-events-none">
                        <Ruler className="w-5 h-5" />
                    </div>
                    <select
                        value={attributes.bodySize || ""}
                        onChange={(e) => handleChange("bodySize", e.target.value)}
                        className={getInputClass("bodySize")}
                    >
                        <option value="">Select Size</option>
                        {BODY_SIZE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                {renderFieldError("bodySize")}
            </motion.div>

            {/* Skin Tone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
            >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-2.5">

                    <div className="flex items-center gap-2">
                        <label className={guideHeaderLabelClass}>Skin Tone</label>
                        <span className={requiredBadgeClass}>Required</span>
                    </div>
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
                        className={getInputClass("skinTone")}
                    >
                        <option value="">Select Tone</option>
                        {SKIN_TONE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                {renderFieldError("skinTone")}
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
