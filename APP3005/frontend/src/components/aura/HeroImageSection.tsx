import { motion } from "framer-motion";
import auraHero from "@/assets/aura-hero.png";

export const HeroImageSection = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        >
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-no-repeat"
                style={{
                    backgroundImage: `url(${auraHero})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 20%'
                }}
            />

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-charcoal/70 via-charcoal/50 to-charcoal/30" />

            {/* Quote Content */}
            <div className="relative z-10 flex flex-col justify-end items-center px-16 pb-20 text-ivory w-full">
                <motion.blockquote
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-3xl lg:text-4xl xl:text-5xl font-serif leading-tight text-center"
                    style={{ textShadow: '0 4px 20px rgba(0, 0, 0, 0.9)' }}
                >
                    "Your Aura defines your style."
                </motion.blockquote>
            </div>
        </motion.div>
    );
};
