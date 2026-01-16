import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: ReactNode;
  heroImage: string;
  quote: string;
  quoteAuthor?: string;
}

export const AuthLayout = ({ children, heroImage, quote, quoteAuthor }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-luxury-black overflow-x-hidden">
      {/* Left Side - Hero Image with Quote - Hidden on Mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden h-screen sticky top-0"
      >
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-black/90 via-luxury-black/60 to-transparent" />

        <div className="relative z-10 flex flex-col justify-center items-start px-20 text-luxury-cream h-full max-w-2xl">
          <motion.blockquote
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-6xl font-serif italic leading-tight mb-8"
          >
            "{quote}"
          </motion.blockquote>
          {quoteAuthor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex items-center gap-4"
            >
              <div className="h-[1px] w-12 bg-luxury-gold" />
              <p className="text-xl text-luxury-gold font-light tracking-widest uppercase">
                {quoteAuthor}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Right Side - Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen relative z-10">
        {/* Brand Logo - Fixed position for consistency */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-4 lg:p-8 flex justify-between items-center w-full"
        >
          <Link to="/" className="inline-block group focus:outline-none">
            <h1 className="text-3xl font-serif text-luxury-gold tracking-tight group-hover:text-luxury-cream transition-colors duration-300">
              AiVestire
            </h1>
          </Link>
          <Link to="/">
            <button className="text-xs text-neutral-500 hover:text-luxury-gold transition-all duration-300 font-medium tracking-widest uppercase flex items-center gap-2 group">
              <span className="group-hover:translate-x-[-4px] transition-transform duration-300">←</span>
              <span>Home</span>
            </button>
          </Link>
        </motion.div>

        {/* Form Content - Optimized for Mobile */}
        <div className="flex-1 flex items-start justify-center p-4 sm:p-8 lg:p-24 pt-2 sm:pt-4 lg:pt-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md bg-white/5 lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-2xl sm:rounded-3xl border border-white/10 lg:border-none backdrop-blur-sm lg:backdrop-blur-none"
          >
            {children}
          </motion.div>
        </div>

        {/* Footer info for mobile only */}
        <div className="lg:hidden p-8 text-center border-t border-white/5 bg-black/20">
          <p className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} AiVestire. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
