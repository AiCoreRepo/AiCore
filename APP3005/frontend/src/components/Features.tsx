import { Sparkles, Wand2, Leaf } from "lucide-react";

const features = [
    {
        icon: Sparkles,
        title: "Personalized AI Try-On",
        description: "Interactive demo for perfect fit.",
    },
    {
        icon: Wand2,
        title: "Let AI Decide — Curated picks",
        description: "Your style, elevated by intelligence.",
    },
    {
        icon: Leaf,
        title: "Sustainable digital fittings",
        description: "Fashion without waste.",
    },
];

export const Features = () => {
    return (
        <section
            id="about"
            className="py-6 md:py-8 relative"
            style={{
                background: 'linear-gradient(180deg, rgba(232, 220, 200, 0.6) 0%, rgba(242, 234, 216, 0.8) 50%, rgba(232, 220, 200, 0.6) 100%)',
            }}
        >
            <div className="container-luxury">
                {/* Tagline */}
                <p className="text-center text-charcoal font-serif text-xl md:text-2xl mb-10">
                    Luxurious design. Intelligent styling. Effortless shopping.
                </p>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="backdrop-blur-xl rounded-3xl p-6 text-center transition-all duration-300 hover:-translate-y-2 group"
                            style={{
                                background: 'linear-gradient(135deg, rgba(232, 220, 200, 0.9) 0%, rgba(242, 234, 216, 0.85) 100%)',
                                boxShadow: '0 4px 20px rgba(201, 165, 92, 0.15), 0 1px 4px rgba(0, 0, 0, 0.05)',
                                border: '1px solid rgba(201, 165, 92, 0.25)',
                            }}
                        >
                            {/* Icon */}
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.2) 0%, rgba(201, 165, 92, 0.3) 100%)',
                                    boxShadow: '0 4px 12px rgba(201, 165, 92, 0.2)',
                                }}
                            >
                                <feature.icon className="w-6 h-6 text-gold" />
                            </div>

                            {/* Title */}
                            <h3 className="font-serif text-lg text-charcoal mb-2 group-hover:text-gold transition-colors duration-300">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-muted-foreground text-sm">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
