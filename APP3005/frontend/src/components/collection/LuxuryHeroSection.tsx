export const LuxuryHeroSection = () => {
    return (
        <section
            className="relative py-16 md:py-20 flex items-center justify-center overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #FAFAF8 0%, #F5F0E6 100%)',
            }}
        >
            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                {/* Brand Name */}
                <div className="mb-6">
                    <h1
                        className="font-serif text-xl md:text-2xl tracking-[0.5em] mb-4"
                        style={{
                            color: '#D4AF37',
                            fontWeight: 300,
                            letterSpacing: '0.5em'
                        }}
                    >
                        AIVESTIRE
                    </h1>
                </div>

                {/* Main Tagline */}
                <h2
                    className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-4"
                    style={{
                        color: '#2C2C2C',
                        fontWeight: 400,
                        letterSpacing: '0.02em'
                    }}
                >
                    Crafted for the Confident.
                </h2>

                {/* Decorative Line */}
                <div className="flex items-center justify-center gap-4 mb-6">
                    <div
                        className="h-px w-20"
                        style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }}
                    />
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#D4AF37' }}
                    />
                    <div
                        className="h-px w-20"
                        style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }}
                    />
                </div>

                {/* Subtitle */}
                <p
                    className="text-sm md:text-base max-w-2xl mx-auto"
                    style={{
                        color: '#666',
                        lineHeight: '1.8'
                    }}
                >
                    Discover our curated collection of premium fashion pieces
                </p>
            </div>
        </section>
    );
};
