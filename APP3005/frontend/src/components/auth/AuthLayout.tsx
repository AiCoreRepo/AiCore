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
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image with Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-black/80 via-luxury-black/60 to-luxury-black/40" />
        
        <div className="relative z-10 flex flex-col justify-center items-start px-16 text-luxury-cream">
          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl font-serif leading-tight mb-6"
          >
            "{quote}"
          </motion.blockquote>
          {quoteAuthor && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg text-luxury-gold font-light"
            >
              — {quoteAuthor}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Right Side - Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col bg-luxury-black">
        {/* Brand Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-8"
        >
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-serif text-luxury-gold">AiVestire</h1>
          </Link>
        </motion.div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
