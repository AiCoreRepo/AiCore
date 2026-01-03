import heroImage from "@/assets/hero-fashion.jpg";
import { Link } from "react-router-dom";

const HeroSection = () => {
    return (
        <section className="relative min-h-screen w-full overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={heroImage}
                    alt="AI Fashion Model in elegant black dress beside a majestic horse"
                    className="h-full w-full object-cover object-[50%_20%]"
                />
                {/* Gradient Overlays - "Light Black" overlay as requested */}
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center">
                {/* Subheadline from image */}
                <p className="animate-fade-in-up mb-4 font-body text-sm tracking-wide text-white/90 md:text-base">
                    Designed by Vision. Worn by Imagination.
                </p>

                {/* Main Headline - Constrained width and size to match reference image exactly */}
                <h1 className="animate-fade-in-up max-w-xl font-serif text-3xl font-medium leading-tight tracking-wide text-white md:text-4xl lg:text-5xl">
                    Where Artificial Intelligence
                    <br />
                    <span className="text-white">Meets Haute Couture.</span>
                </h1>

                {/* CTA Section */}
                <div className="animate-fade-in-up mt-8 flex flex-col items-center gap-4 md:mt-10 md:gap-5">
                    {/* View Collection Link */}
                    <Link
                        to="/user-login"
                        className="font-body text-base tracking-wide text-white transition-colors hover:text-luxury-gold md:text-lg"
                    >
                        View New Collection.
                    </Link>

                    {/* Primary CTA Button - Light style as per image */}
                    <Link
                        to="/user-login"
                        className="group relative overflow-hidden rounded-full border border-white bg-white/90 px-8 py-3 font-body text-sm uppercase tracking-widest text-black transition-all duration-500 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] md:px-10 md:py-4 md:text-base"
                    >
                        <span className="relative z-10">[Try AI Styling Now]</span>
                    </Link>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/50 to-white" />
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
