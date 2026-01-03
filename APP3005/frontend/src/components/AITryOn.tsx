import { useState } from "react";
import { Upload, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const stylePresets = [
    { id: 1, image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=60&h=60&fit=crop" },
    { id: 2, image: "https://images.unsplash.com/photo-1551803091-e20673f15770?w=60&h=60&fit=crop" },
    { id: 3, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&h=60&fit=crop" },
    { id: 4, image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=60&h=60&fit=crop" },
];

const colorSwatches = ["#000000", "#C9A55C", "#F8F1E6", "#722F37", "#1C3A5E"];

export const AITryOn = () => {
    const [aiDecideActive, setAiDecideActive] = useState(false);

    return (
        <section id="ai-tryon" className="py-12 md:py-16 bg-background">
            <div className="container-luxury">
                <div className="glass-panel rounded-3xl p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Left: Demo Interface */}
                        <div className="flex gap-4 items-start">
                            {/* Upload Area */}
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-ivory border-2 border-dashed border-gold/40 flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-1">
                                        <Upload className="w-5 h-5 text-gold" />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">Photo upload</span>
                                </div>
                            </div>

                            {/* Style Presets & Colors */}
                            <div className="flex-1 space-y-4">
                                {/* Style Presets Label */}
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-gold" />
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Style Presets</span>
                                </div>

                                {/* Style Preset Images */}
                                <div className="flex gap-2">
                                    {stylePresets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            className="w-12 h-12 rounded-lg overflow-hidden border-2 border-transparent hover:border-gold transition-colors"
                                        >
                                            <img
                                                src={preset.image}
                                                alt="Style preset"
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Color Swatches */}
                                <div className="space-y-2">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Color</span>
                                    <div className="flex gap-2">
                                        {colorSwatches.map((color) => (
                                            <button
                                                key={color}
                                                className="w-6 h-6 rounded-full border-2 border-gold/20 hover:border-gold transition-colors"
                                                style={{ backgroundColor: color }}
                                                aria-label={`Select color ${color}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Style Presets Button */}
                                <button className="px-4 py-2 bg-gold/10 text-charcoal text-xs font-medium rounded-full hover:bg-gold/20 transition-colors">
                                    Style presets
                                </button>
                            </div>
                        </div>

                        {/* Right: Description & Toggle */}
                        <div className="space-y-6">
                            <div>
                                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                                    Try tection makes explain that AI to coutra. Try AI Styling optimization to video and more.
                                </p>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-wrap items-center gap-4">
                                <Link to="/user-login">
                                    <button className="btn-gold-glow text-sm px-6 py-3">
                                        Try AI Styling Now
                                    </button>
                                </Link>

                                {/* AI Decide Toggle */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setAiDecideActive(!aiDecideActive)}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${aiDecideActive ? "bg-gold" : "bg-muted"
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-ivory shadow-md transition-transform duration-300 ${aiDecideActive ? "translate-x-6" : ""
                                                }`}
                                        />
                                    </button>
                                    <span className="text-sm text-charcoal font-medium">Let AI Decide</span>
                                </div>
                            </div>

                            {/* AI Decide Description */}
                            <p className="text-xs text-muted-foreground">
                                When toggled, animates small showing outfits, avealing curated outfits.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
