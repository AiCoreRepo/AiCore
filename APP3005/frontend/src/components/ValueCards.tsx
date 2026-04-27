import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { IMG } from "@/constants/cloudinary-images";

/* ─── STORY CARD DATA ─────────────────────────────────────── */
const storyCards = [
  {
    id: "artisans",
    scrollTo: "#section-artisans",
    number: "01",
    category: "Heritage",
    title: "From Hands\nto Heritage",
    tagline: "Every thread carries a story of generations.",
    image: IMG.jaipurArtisansThread,
    accent: "#D4AF37",
    accentRgb: "212,175,55",
  },
  {
    id: "tryon",
    scrollTo: "#section-tryon",
    number: "02",
    category: "Experience",
    title: "See It Before\nYou Wear It",
    tagline: "Confidence before every purchase.",
    image: IMG.jaipurWomenCraft,
    accent: "#C9A55C",
    accentRgb: "201,165,92",
  },
  {
    id: "recommendation",
    scrollTo: "#section-recommendation",
    number: "03",
    category: "Intelligence",
    title: "Styled Just\nFor You",
    tagline: "Your personal AI stylist, always learning.",
    image: IMG.jaipurShopWomen,
    accent: "#B8860B",
    accentRgb: "184,134,11",
  },
  {
    id: "aura",
    scrollTo: "#section-aura",
    number: "04",
    category: "Identity",
    title: "Your Style Has\nan Identity",
    tagline: "Not just fashion — your evolving aura.",
    image: IMG.jaipurStreetMural,
    accent: "#D4AF37",
    accentRgb: "212,175,55",
  },
];

/* ─── STORY CARD COMPONENT ────────────────────────────────── */
const StoryCard = ({
  card,
}: {
  card: (typeof storyCards)[0];
}) => {
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    const el = document.querySelector(card.scrollTo);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      data-gsap="story-card"
      data-gsap-hover="tilt-card"
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative min-h-[360px] cursor-pointer overflow-hidden rounded-[20px] xs:min-h-[400px] sm:min-h-[480px]"
      role="button"
      tabIndex={0}
      style={{
        transformStyle: "preserve-3d",
        boxShadow: hovered
          ? `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(${card.accentRgb},0.45), 0 0 40px rgba(${card.accentRgb},0.18)`
          : "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {/* Background image */}
      <div
        data-gsap="story-card-bg"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${card.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: hovered ? "scale(1.06)" : "scale(1)",
          transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
        }}
      />

      {/* Gradient overlay — always present for text legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.72) 100%)",
          transition: "opacity 0.4s ease",
        }}
      />

      {/* Gold glow on hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at bottom left, rgba(${card.accentRgb},0.22) 0%, transparent 65%)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* Glass border shimmer on hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "20px",
          border: hovered
            ? `1px solid rgba(${card.accentRgb},0.5)`
            : "1px solid rgba(255,255,255,0.1)",
          transition: "border-color 0.4s ease",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        data-gsap="story-card-content"
        className="relative z-10 flex h-full min-h-[360px] flex-col justify-between p-6 xs:min-h-[400px] xs:p-7 sm:min-h-[480px] sm:p-11"
      >
        {/* Top — number + category */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.1rem, 9vw, 2.6rem)",
              fontWeight: 700,
              color: `rgba(${card.accentRgb},0.35)`,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {card.number}
          </span>
          <span
            style={{
              fontSize: "8.5px",
              textTransform: "uppercase",
              letterSpacing: "0.32em",
              color: `rgba(${card.accentRgb},0.85)`,
              fontWeight: 600,
              background: `rgba(${card.accentRgb},0.12)`,
              border: `1px solid rgba(${card.accentRgb},0.3)`,
              padding: "5px 14px",
              borderRadius: "100px",
            }}
          >
            {card.category}
          </span>
        </div>

        {/* Bottom — title + tagline + arrow */}
        <div>
          {/* Divider line */}
          <div
            style={{
              width: hovered ? "56px" : "32px",
              height: "1px",
              background: `rgba(${card.accentRgb},0.7)`,
              marginBottom: "16px",
              transition: "width 0.4s ease",
            }}
          />

          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.45rem, 6vw, 2.2rem)",
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.22,
              marginBottom: "12px",
              whiteSpace: "pre-line",
            }}
          >
            {card.title}
          </h3>

          <p
            style={{
              fontSize: "0.92rem",
              color: "rgba(255,255,255,0.62)",
              lineHeight: 1.65,
              marginBottom: "24px",
              maxWidth: "20rem",
            }}
          >
            {card.tagline}
          </p>

          {/* CTA */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.24em",
              fontWeight: 600,
              color: `hsl(44 78% 72%)`,
              transform: hovered ? "translateX(6px)" : "translateX(0)",
              transition: "transform 0.35s ease",
            }}
          >
            Discover Story
            <ArrowRight
              style={{
                width: 15,
                height: 15,
                opacity: hovered ? 1 : 0.6,
                transition: "opacity 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN SECTION ────────────────────────────────────────── */
export const ValueCards = () => {
  return (
    <section
      id="stories"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-32"
      style={{
        background: "hsl(30 14% 8%)",
      }}
    >
      {/* Subtle BG noise/glow */}
      <div
        aria-hidden
        data-gsap="ambient-orb"
        data-gsap-drift="18"
        style={{
          position: "absolute",
          top: "-6rem",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80vw",
          height: "32rem",
          background:
            "radial-gradient(ellipse, rgba(212,175,55,0.055) 0%, transparent 65%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      <div className="container-luxury">
        {/* ── Section Header ── */}
        <div
          data-gsap="section-heading"
          className="mb-12 text-center sm:mb-16 lg:mb-[4.5rem]"
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <span
              style={{
                display: "block",
                height: "1px",
                width: "36px",
                background: "hsl(44 78% 54%)",
              }}
            />
            <span
              style={{
                fontSize: "8.5px",
                textTransform: "uppercase",
                letterSpacing: "0.34em",
                fontWeight: 600,
                color: "hsl(44 78% 54%)",
              }}
            >
              Four Stories
            </span>
            <span
              style={{
                display: "block",
                height: "1px",
                width: "36px",
                background: "hsl(44 78% 54%)",
              }}
            />
          </div>

          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.9rem, 3.5vw, 3rem)",
              color: "hsl(40 38% 92%)",
              lineHeight: 1.1,
              marginBottom: "14px",
            }}
          >
            Where would you like to{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 400,
                background:
                  "linear-gradient(135deg, hsl(44 78% 68%), hsl(40 62% 52%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              begin?
            </em>
          </h2>

          <p
            style={{
              fontSize: "0.98rem",
              color: "rgba(255,255,255,0.38)",
              maxWidth: "42rem",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Each card is a portal — click to immerse yourself in a chapter of the Aivestire story.
          </p>
        </div>

        {/* ── 2×2 Story Card Grid ── */}
        <div data-gsap-group="story-grid" className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {storyCards.map((card) => (
            <StoryCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
};
