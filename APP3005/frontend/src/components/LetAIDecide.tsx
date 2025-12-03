import { Link } from "react-router-dom";

export const LetAIDecide = () => {
    return (
        <section id="ai-decide" className="py-12 md:py-16 bg-ivory-light">
            <div className="container-luxury">
                <div className="glass-panel rounded-3xl p-8 md:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Description */}
                        <div className="space-y-6">
                            <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-4">
                                Let AI Decide — Curated picks
                            </h2>
                            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                                Your style, delivered by intelligence. When toggled, animates small showing outfits, revealing curated outfits.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Try tection makes explain that AI to coutra. Try AI Styling optimization to video and more.
                            </p>

                            <div className="pt-4">
                                <Link to="/user-login">
                                    <button className="btn-gold-glow text-base px-8 py-4">
                                        Try AI Styling Now
                                    </button>
                                </Link>
                            </div>
                        </div>

                        {/* Right: Visual Demo */}
                        <div className="relative">
                            <div className="glass-panel rounded-2xl p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-serif text-xl text-charcoal">AI Styling Demo</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gold rounded-full animate-pulse"></span>
                                        <span className="text-sm text-muted-foreground">AI Active</span>
                                    </div>
                                </div>

                                {/* Demo visualization */}
                                <div className="space-y-4">
                                    <div className="bg-ivory/50 rounded-lg p-4 border border-gold/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                                                <span className="text-gold font-serif">AI</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-charcoal">Style Analysis</p>
                                                <p className="text-xs text-muted-foreground">Processing preferences...</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-2 bg-gold/30 rounded-full overflow-hidden">
                                                <div className="h-full bg-gold rounded-full animate-shimmer" style={{ width: '75%' }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="aspect-square bg-ivory rounded-lg border-2 border-gold/30 overflow-hidden group cursor-pointer hover:border-gold transition-colors">
                                                <div className="w-full h-full bg-gradient-to-br from-gold/10 to-charcoal/5 flex items-center justify-center">
                                                    <span className="text-xs text-muted-foreground group-hover:text-gold transition-colors">
                                                        Outfit {i}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <p className="text-xs text-center text-muted-foreground italic">
                                        "When toggled, animates small showing outfits, revealing curated outfits."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
