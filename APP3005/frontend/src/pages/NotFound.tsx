import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0f0f0f 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background decoration */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ textAlign: "center", maxWidth: "520px", width: "100%", position: "relative" }}
      >
        {/* 404 number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            fontSize: "clamp(96px, 20vw, 160px)",
            fontWeight: "800",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, #D4AF37 0%, #B8962E 50%, #D4AF37 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "0.5rem",
            userSelect: "none",
          }}
        >
          404
        </motion.div>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)",
            margin: "1.5rem auto",
            maxWidth: "240px",
          }}
        />

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: "600",
            color: "#f5f0e8",
            marginBottom: "0.75rem",
            letterSpacing: "-0.01em",
          }}
        >
          Page Not Found
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{
            fontSize: "15px",
            color: "rgba(245,240,232,0.45)",
            marginBottom: "2.5rem",
            lineHeight: 1.6,
          }}
        >
          The page{" "}
          <span style={{ color: "rgba(212,175,55,0.7)", fontFamily: "monospace", fontSize: "13px" }}>
            {location.pathname}
          </span>{" "}
          doesn't exist or has been moved.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap" }}
        >
          {/* Primary: Go Home */}
          <button
            onClick={() => navigate("/")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #D4AF37, #B8962E)",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "opacity 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Home size={15} />
            Go to Homepage
          </button>

          {/* Secondary: Go Back */}
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: "transparent",
              color: "rgba(245,240,232,0.7)",
              border: "1px solid rgba(212,175,55,0.25)",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "border-color 0.2s, color 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.5)";
              e.currentTarget.style.color = "#f5f0e8";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.25)";
              e.currentTarget.style.color = "rgba(245,240,232,0.7)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
        </motion.div>

        {/* Browse collection link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          style={{ marginTop: "2rem" }}
        >
          <button
            onClick={() => navigate("/collection")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              background: "none",
              border: "none",
              color: "rgba(212,175,55,0.6)",
              fontSize: "13px",
              cursor: "pointer",
              padding: "0.25rem",
              transition: "color 0.2s",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              textDecorationColor: "rgba(212,175,55,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#D4AF37";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(212,175,55,0.6)";
            }}
          >
            <Search size={12} />
            Browse our collection
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
