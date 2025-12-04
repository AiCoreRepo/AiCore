import { motion } from "framer-motion";

interface BodyAttributes {
    height?: number;
    weight?: number;
    skinTone?: string;
    gender?: string;
    bodyShape?: string;
    ageRange?: string;
    hairStyle?: string;
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
            {/* Section Header - Lighter divider */}
            <div className="flex items-center gap-3 pb-3 border-b border-gold/10">
                <div className="w-1 h-6 bg-gradient-to-b from-gold to-gold/50 rounded-full"></div>
                <h3 className="text-base font-bold text-charcoal">Body Attributes</h3>
            </div>

            {/* Row 1: Height & Weight */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <label className={labelClass}>Height (cm)</label>
                    <input
                        type="number"
                        placeholder="170"
                        value={attributes.height || ""}
                        onChange={(e) => handleChange("height", parseInt(e.target.value) || 0)}
                        className={inputClass}
                    />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <label className={labelClass}>Weight (kg)</label>
                    <input
                        type="number"
                        placeholder="65"
                        value={attributes.weight || ""}
                        onChange={(e) => handleChange("weight", parseInt(e.target.value) || 0)}
                        className={inputClass}
                    />
                </motion.div>
            </div>

            {/* Row 2: Gender & Age Range */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <label className={labelClass}>Gender</label>
                    <select
                        value={attributes.gender || ""}
                        onChange={(e) => handleChange("gender", e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <label className={labelClass}>Age Range</label>
                    <select
                        value={attributes.ageRange || ""}
                        onChange={(e) => handleChange("ageRange", e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select Age</option>
                        <option value="18-25">18-25 years</option>
                        <option value="26-35">26-35 years</option>
                        <option value="36-45">36-45 years</option>
                        <option value="46-55">46-55 years</option>
                        <option value="56+">56+ years</option>
                    </select>
                </motion.div>
            </div>

            {/* Row 3: Skin Tone & Body Shape */}
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
                        <option value="fair">Fair</option>
                        <option value="medium">Medium</option>
                        <option value="olive">Olive</option>
                        <option value="tan">Tan</option>
                        <option value="dark">Dark</option>
                    </select>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <label className={labelClass}>Body Shape</label>
                    <select
                        value={attributes.bodyShape || ""}
                        onChange={(e) => handleChange("bodyShape", e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select Shape</option>
                        <option value="athletic">Athletic</option>
                        <option value="slim">Slim</option>
                        <option value="average">Average</option>
                        <option value="curvy">Curvy</option>
                        <option value="plus">Plus Size</option>
                    </select>
                </motion.div>
            </div>

            {/* Row 4: Hair Style (Full Width) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <label className={labelClass}>Hair Style</label>
                <select
                    value={attributes.hairStyle || ""}
                    onChange={(e) => handleChange("hairStyle", e.target.value)}
                    className={inputClass}
                >
                    <option value="">Select Hair Style</option>
                    <option value="short">Short</option>
                    <option value="medium">Medium Length</option>
                    <option value="long">Long</option>
                    <option value="bald">Bald</option>
                    <option value="curly">Curly</option>
                    <option value="straight">Straight</option>
                    <option value="wavy">Wavy</option>
                </select>
            </motion.div>
        </div>
    );
};
