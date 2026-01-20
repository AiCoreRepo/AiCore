import { motion } from "framer-motion";
import {
    SKIN_TONE_OPTIONS,
    BODY_SHAPE_OPTIONS,
    GENDER_OPTIONS,
    AGE_RANGE_OPTIONS,
    BODY_TYPE_OPTIONS
} from "@/constants/aura.constants";

interface BodyAttributes {
    height?: number;
    weight?: number;
    skinTone?: string;
    gender?: string;
    bodyShape?: string;
    ageRange?: string;
    bodyType?: string;
}

interface BodyAttributesFormProps {
    attributes: BodyAttributes;
    onChange: (attributes: BodyAttributes) => void;
}

export const BodyAttributesForm = ({ attributes, onChange }: BodyAttributesFormProps) => {
    const handleChange = (field: keyof BodyAttributes, value: string | number) => {
        onChange({ ...attributes, [field]: value });
    };

    const inputClass = "w-full px-4 py-3 rounded-xl border border-gold/30 bg-white/80 text-charcoal text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-300 hover:border-gold/50 hover:bg-white shadow-sm";
    const labelClass = "block text-xs font-semibold text-charcoal/80 mb-2 uppercase tracking-wide";

    return (
        <div className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-gold/10">
                <div className="w-1 h-6 bg-gradient-to-b from-gold to-gold/50 rounded-full"></div>
                <h3 className="text-base font-bold text-charcoal">Your Attributes</h3>
            </div>

            {/* Row 1: Body Shape & Body Type */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <label className={labelClass}>Body Shape</label>
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
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <label className={labelClass}>Body Type</label>
                    <select
                        value={attributes.bodyType || ""}
                        onChange={(e) => handleChange("bodyType", e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select Body Type</option>
                        {BODY_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </motion.div>
            </div>

            {/* Row 2: Height & Weight */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <label className={labelClass}>Height (cm)</label>
                    <input
                        type="number"
                        placeholder="162"
                        value={attributes.height || ""}
                        onChange={(e) => handleChange("height", parseInt(e.target.value) || 0)}
                        className={inputClass}
                    />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <label className={labelClass}>Weight (kg)</label>
                    <input
                        type="number"
                        placeholder="55"
                        value={attributes.weight || ""}
                        onChange={(e) => handleChange("weight", parseInt(e.target.value) || 0)}
                        className={inputClass}
                    />
                </motion.div>
            </div>

            {/* Row 3: Skin Tone & Gender */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <label className={labelClass}>Skin Tone</label>
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
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <label className={labelClass}>Gender</label>
                    <select
                        value={attributes.gender || ""}
                        onChange={(e) => handleChange("gender", e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select Gender</option>
                        {GENDER_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </motion.div>
            </div>

            {/* Row 4: Age Range (Full Width) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <label className={labelClass}>Age Range</label>
                <select
                    value={attributes.ageRange || ""}
                    onChange={(e) => handleChange("ageRange", e.target.value)}
                    className={inputClass}
                >
                    <option value="">Select Age Range</option>
                    {AGE_RANGE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </motion.div>
        </div>
    );
};
