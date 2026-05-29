import { useState, useRef, useEffect } from "react";
import { ArrowRight, X, Upload, Scan, Wand2, Sparkles } from "lucide-react";
import { IMG } from "@/constants/cloudinary-images";

/* ─── STORY CARD DATA ─────────────────────────────────────── */
const storyCards = [
  {
    id: "artisans",
    number: "01",
    category: "Artisans",
    title: "Craft Begins\nWith Hands",
    tagline: "Jaipur artisans shape every thread, motif, and silhouette before it reaches the digital stage.",
    image: IMG.storyLoomHands,
    bgPosition: "center center",
    accent: "#D4AF37",
    accentRgb: "212,175,55",
    ctaLabel: "Meet The Artisans",
  },
  {
    id: "tryon",
    number: "02",
    category: "Try On",
    title: "See It Before\nYou Wear It",
    tagline: "AI maps every garment's drape, embroidery, and fit onto your exact body shape — buy with full confidence.",
    image: IMG.tryonRealistic,
    bgPosition: "center top",
    accent: "#C9A55C",
    accentRgb: "201,165,92",
    ctaLabel: "Explore Try On",
  },
  {
    id: "aura",
    number: "03",
    category: "Aura",
    title: "Your Style\nHas An Identity",
    tagline: "Your Aura profile learns your aesthetic and guides every recommendation — Minimal, Bold, Heritage, or Avant-Garde.",
    image: IMG.auraHeritageSaree,
    bgPosition: "center top",
    accent: "#B8860B",
    accentRgb: "184,134,11",
    ctaLabel: "Discover Your Aura",
  },
  {
    id: "stories",
    number: "04",
    category: "Stories",
    title: "Craft Reaches\nThe Right Wardrobe",
    tagline: "A direct bridge: meaningful artisan work reaching people who can see, trust, and wear the story.",
    image: IMG.jaipurShopWomen,
    bgPosition: "center 30%",
    accent: "#D4AF37",
    accentRgb: "212,175,55",
    ctaLabel: "Read Stories",
  },
];

/* ─── EXPAND PANEL CONTENT ────────────────────────────────── */

const ArtisansExpandContent = () => (
  <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
    <div>
      <div className="mb-5 inline-flex items-center gap-3">
        <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
        <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>
          The Artisans
        </span>
      </div>
      <h3 className="mb-6 font-serif text-3xl leading-tight text-[#F8F2E9] lg:text-4xl">
        Every thread carries a{" "}
        <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>
          story of generations
        </em>
        .
      </h3>
      <p className="mb-8 text-base leading-relaxed text-[#F8F2E9]/60">
        We partner directly with masterful creators in Jaipur — block-printers, weavers, and embroiderers who have preserved these heritage crafts. Aivestire brings their art to the global stage, ensuring fair recognition and direct connection with buyers who value true craftsmanship.
      </p>
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.2)" }}>
        <p className="text-[#F8F2E9]/80 italic mb-4">"This platform gave my work a global audience, allowing my family's legacy to thrive in the modern world."</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img src={IMG.jaipurArtisansThread} alt="Artisan" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-sm text-[#F8F2E9] font-medium">Rajendra Kumar</div>
            <div className="text-xs text-[#F8F2E9]/40 uppercase tracking-widest mt-1">Master Weaver</div>
          </div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="space-y-3 pt-4 sm:space-y-4 sm:pt-12">
        <div className="overflow-hidden rounded-2xl">
          <img src={IMG.jaipurBwEmbroidery} alt="Embroidery" className="h-[120px] w-full rounded-2xl object-cover sm:h-[180px] md:h-[240px]" style={{ filter: "brightness(0.85)" }} />
        </div>
        <div className="overflow-hidden rounded-2xl">
          <img src={IMG.jaipurWomenGroup} alt="Artisans" className="h-[100px] w-full rounded-2xl object-cover sm:h-[150px] md:h-[180px]" style={{ filter: "brightness(0.85)" }} />
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <div className="overflow-hidden rounded-2xl">
          <img src={IMG.jaipurTextileMarket} alt="Textile Market" className="h-[110px] w-full rounded-2xl object-cover sm:h-[170px] md:h-[220px]" style={{ filter: "brightness(0.85)" }} />
        </div>
        <div className="overflow-hidden rounded-2xl">
          <img src={IMG.jaipurArtisansThread} alt="Thread Work" className="h-[110px] w-full rounded-2xl object-cover sm:h-[170px] md:h-[220px]" style={{ filter: "brightness(0.85)" }} />
        </div>
      </div>
    </div>
  </div>
);

const TryOnExpandContent = () => (
  <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
    <div className="order-2 lg:order-1 relative group">
      <div className="relative z-10 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
        <img src={IMG.tryonRealistic} alt="Virtual Try On" className="w-full max-h-[320px] xs:max-h-[380px] sm:max-h-[500px] lg:max-h-none object-cover object-top" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#D4AF37]/20 blur-[120px] rounded-full" />
    </div>
    <div className="order-1 lg:order-2 max-w-xl">
      <div className="mb-5 inline-flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>Virtual Try-On</span>
        <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
      </div>
      <h3 className="mb-5 font-serif text-3xl leading-tight text-[#F8F2E9] lg:text-4xl">
        See it before you{" "}
        <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>wear it</em>
      </h3>
      <p className="mb-8 text-base text-[#F8F2E9]/60">
        We bridge the gap between imagination and reality. Our advanced AI seamlessly maps complex heritage garments onto your exact body shape, ensuring you buy with absolute confidence.
      </p>
      <div className="space-y-2.5 xs:space-y-3 sm:space-y-4">
        {[
          { icon: <Upload className="h-5 w-5" />, step: "01", title: "Upload Image", desc: "Provide a clear, front-facing photo of yourself in casual wear." },
          { icon: <Scan className="h-5 w-5" />, step: "02", title: "AI Processing", desc: "Our system maps the 3D drape and intricate embroidery to your proportions." },
          { icon: <Wand2 className="h-5 w-5" />, step: "03", title: "Visualize", desc: "Instantly see the exact look and fit before making a purchase." },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-3 rounded-xl p-3 xs:p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37" }}>
              {item.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]/60">{item.step}</span>
                <span className="text-sm font-semibold text-[#F8F2E9]">{item.title}</span>
              </div>
              <p className="text-xs xs:text-sm text-[#F8F2E9]/55">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AURA_STYLES = [
  { name: "Minimal", desc: "Clean lines & refined elegance", src: IMG.auraMinimalSaree },
  { name: "Bold", desc: "Vibrant & celebratory", src: IMG.auraBoldSaree },
  { name: "Heritage", desc: "Classic & royal grace", src: IMG.auraHeritageSaree },
  { name: "Avant-Garde", desc: "Modern fusion & fresh", src: IMG.auraAvantgardeSaree },
];

const AuraExpandContent = () => (
  <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
    <div className="order-2 lg:order-1">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {AURA_STYLES.map((aura) => (
          <div key={aura.name} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-[3/4] cursor-pointer">
            <img src={aura.src} alt={aura.name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-2.5 xs:p-3 sm:p-4 text-left">
              <h4 className="mb-0.5 font-serif text-sm xs:text-base sm:text-lg text-[#F8F2E9]">{aura.name}</h4>
              <p className="text-[9.5px] xs:text-xs text-[#F8F2E9]/60 leading-tight">{aura.desc}</p>
            </div>
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="order-1 lg:order-2 max-w-xl">
      <div className="mb-5 inline-flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>Your Aura</span>
        <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
      </div>
      <h3 className="mb-6 font-serif text-3xl leading-tight text-[#F8F2E9] lg:text-4xl">
        Your Style Has an{" "}
        <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>Identity</em>
      </h3>
      <p className="mb-6 text-base leading-relaxed text-[#F8F2E9]/60">
        Your Aura is your evolving digital style fingerprint. It captures the essence of your aesthetic — whether Minimal, Bold, or Heritage — and guides every interaction on Aivestire.
      </p>
      <div className="mb-8 rounded-2xl p-5" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm font-medium text-[#F8F2E9]">AI Stylist Picks For You</span>
        </div>
        <p className="text-sm text-[#F8F2E9]/55">
          Our AI learns your preferences, past choices, and Aura profile to curate a hyper-personalized feed — from everyday elegance to occasion-specific heritage wear.
        </p>
      </div>
    </div>
  </div>
);

const StoriesExpandContent = () => (
  <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
    {/* Left: Text + bullet points */}
    <div>
      <div className="mb-5 inline-flex items-center gap-3">
        <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
        <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>Stories</span>
      </div>
      <h3 className="mb-6 font-serif text-3xl leading-tight text-[#F8F2E9] lg:text-4xl">
        Craft reaches{" "}
        <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>the right wardrobe</em>
      </h3>
      <p className="mb-8 text-base leading-relaxed text-[#F8F2E9]/60">
        Aivestire is one connected path: artisans create, the platform preserves their story, technology makes each piece understandable, and the right buyer connects with confidence.
      </p>
      <div className="space-y-3">
        {[
          { label: "Direct artisan partnership", desc: "Fair pricing, cultural context, authentic provenance" },
          { label: "AI-powered matching", desc: "Every garment connected to the right person" },
          { label: "Trust-first commerce", desc: "Stories, not just products" },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#D4AF37" }} />
            <div>
              <div className="text-sm font-semibold text-[#F8F2E9]">{item.label}</div>
              <div className="text-sm text-[#F8F2E9]/50">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Right: Stats + Quote + single unique image */}
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {[
          { stat: "200+", label: "Artisan Creators" },
          { stat: "4K+", label: "Heritage Pieces" },
          { stat: "98%", label: "Buyer Satisfaction" },
        ].map((item) => (
          <div
            key={item.stat}
            className="rounded-[12px] sm:rounded-2xl p-2 sm:p-4 text-center flex flex-col justify-center"
            style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.18)" }}
          >
            <div className="font-serif text-base xs:text-lg sm:text-2xl font-semibold mb-0.5 sm:mb-1" style={{ color: "hsl(44 78% 68%)" }}>
              {item.stat}
            </div>
            <div className="text-[7.5px] xs:text-[9px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest text-[#F8F2E9]/45 leading-tight">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Artisan quote */}
      <div
        className="rounded-2xl p-4 sm:p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="mb-3 text-3xl leading-none" style={{ color: "hsl(44 78% 54%)", fontFamily: "Georgia, serif" }}>"</div>
        <p className="text-[#F8F2E9]/75 italic text-sm sm:text-base leading-relaxed mb-4 sm:mb-5">
          "Buyers don't just see a product — they read my story, understand the technique, and feel connected before they ever purchase."
        </p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
            <img src={IMG.jaipurWomenCraft} alt="Artisan" className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#F8F2E9]">Sunita Devi</div>
            <div className="text-xs text-[#F8F2E9]/40 uppercase tracking-widest mt-0.5">Block Print Artisan, Jaipur</div>
          </div>
        </div>
      </div>

      {/* Heritage thread image — only appears here, shown in full */}
      <div className="overflow-hidden rounded-2xl w-full">
        <img
          src={IMG.storyHeritageThread}
          alt="Heritage craft"
          className="w-full max-h-[260px] xs:max-h-[320px] sm:max-h-[440px] lg:max-h-none object-cover object-center block"
          style={{ filter: "brightness(0.85)", display: "block" }}
        />
      </div>
    </div>
  </div>
);


const EXPAND_CONTENT: Record<string, React.ReactNode> = {
  artisans: <ArtisansExpandContent />,
  tryon: <TryOnExpandContent />,
  aura: <AuraExpandContent />,
  stories: <StoriesExpandContent />,
};

/* ─── STORY CARD COMPONENT ────────────────────────────────── */
const StoryCard = ({
  card,
  isActive,
  onClick,
}: {
  card: (typeof storyCards)[0];
  isActive: boolean;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      data-gsap="story-card"
      data-gsap-hover="tilt-card"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative min-h-[260px] cursor-pointer overflow-hidden rounded-[20px] xs:min-h-[320px] sm:min-h-[440px] md:min-h-[480px]"
      role="button"
      tabIndex={0}
      style={{
        transformStyle: "preserve-3d",
        boxShadow: isActive
          ? `0 32px 80px rgba(0,0,0,0.55), 0 0 0 2px rgba(${card.accentRgb},0.7), 0 0 60px rgba(${card.accentRgb},0.25)`
          : hovered
          ? `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(${card.accentRgb},0.45), 0 0 40px rgba(${card.accentRgb},0.18)`
          : "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)",
        transition: "box-shadow 0.4s ease",
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
          backgroundPosition: card.bgPosition ?? "center center",
          transform: hovered || isActive ? "scale(1.06)" : "scale(1)",
          transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isActive
            ? "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.88) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.72) 100%)",
          transition: "background 0.4s ease",
        }}
      />

      {/* Gold glow on hover / active */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at bottom left, rgba(${card.accentRgb},0.22) 0%, transparent 65%)`,
          opacity: hovered || isActive ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* Active indicator — top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: "2px",
          background: `linear-gradient(90deg, transparent, rgba(${card.accentRgb},0.9), transparent)`,
          opacity: isActive ? 1 : 0,
          transition: "opacity 0.4s ease",
          borderRadius: "0 0 4px 4px",
        }}
      />

      {/* Glass border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "20px",
          border: isActive
            ? `1px solid rgba(${card.accentRgb},0.55)`
            : hovered
            ? `1px solid rgba(${card.accentRgb},0.4)`
            : "1px solid rgba(255,255,255,0.08)",
          transition: "border-color 0.4s ease",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        data-gsap="story-card-content"
        className="relative z-10 flex h-full min-h-[260px] flex-col justify-between p-5 xs:min-h-[320px] xs:p-6 sm:min-h-[440px] sm:p-9 md:min-h-[480px] md:p-11"
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
              color: `rgba(${card.accentRgb},0.9)`,
              fontWeight: 600,
              background: isActive ? `rgba(${card.accentRgb},0.18)` : `rgba(${card.accentRgb},0.12)`,
              border: `1px solid rgba(${card.accentRgb},0.35)`,
              padding: "5px 14px",
              borderRadius: "100px",
              transition: "background 0.3s ease",
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
              width: hovered || isActive ? "56px" : "32px",
              height: "1px",
              background: `rgba(${card.accentRgb},0.7)`,
              marginBottom: "clamp(8px, 3vw, 16px)",
              transition: "width 0.4s ease",
            }}
          />

          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.2rem, 5vw, 2.2rem)",
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.22,
              marginBottom: "clamp(6px, 2vw, 12px)",
              whiteSpace: "pre-line",
            }}
          >
            {card.title}
          </h3>

          <p
            style={{
              fontSize: "clamp(0.78rem, 3.5vw, 0.92rem)",
              color: "rgba(255,255,255,0.62)",
              lineHeight: 1.5,
              marginBottom: "clamp(12px, 4vw, 24px)",
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
              color: isActive ? `hsl(44 78% 78%)` : `hsl(44 78% 72%)`,
              transform: hovered || isActive ? "translateX(6px)" : "translateX(0)",
              transition: "transform 0.35s ease, color 0.3s ease",
            }}
          >
            {isActive ? "Close" : card.ctaLabel}
            {isActive ? (
              <X style={{ width: 15, height: 15, opacity: 1 }} />
            ) : (
              <ArrowRight
                style={{
                  width: 15,
                  height: 15,
                  opacity: hovered ? 1 : 0.6,
                  transition: "opacity 0.3s ease",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── EXPAND PANEL ────────────────────────────────────────── */
const ExpandPanel = ({
  cardId,
  accentRgb,
  isOpen,
}: {
  cardId: string | null;
  accentRgb: string;
  isOpen: boolean;
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Slight delay so the panel renders before scrolling
      const timeout = setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, cardId]);

  return (
    <div
      ref={panelRef}
      style={{
        overflow: "hidden",
        maxHeight: isOpen ? "4000px" : "0px",
        opacity: isOpen ? 1 : 0,
        transition: isOpen
          ? "max-height 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease 0.1s"
          : "max-height 0.5s cubic-bezier(0.7,0,0.84,0), opacity 0.3s ease",
        scrollMarginTop: "80px",
      }}
    >
      <div
        style={{
          marginTop: "24px",
          borderRadius: "24px",
          border: `1px solid rgba(${accentRgb},0.25)`,
          background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
          backdropFilter: "blur(12px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "5%",
            right: "5%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.6), transparent)`,
          }}
        />
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at top center, rgba(${accentRgb},0.07) 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />
        <div className="relative z-10 p-6 sm:p-10 lg:p-14">
          {cardId ? EXPAND_CONTENT[cardId] : null}
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN SECTION ────────────────────────────────────────── */
export const ValueCards = () => {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const activeCardData = storyCards.find((c) => c.id === activeCard);

  const handleCardClick = (cardId: string) => {
    setActiveCard((prev) => (prev === cardId ? null : cardId));
  };

  return (
    <section
      id="stories"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-32"
      style={{ background: "hsl(30 14% 8%)" }}
    >
      {/* Subtle BG glow */}
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
          background: "radial-gradient(ellipse, rgba(212,175,55,0.055) 0%, transparent 65%)",
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
            <span style={{ display: "block", height: "1px", width: "36px", background: "hsl(44 78% 54%)" }} />
            <span
              style={{
                fontSize: "8.5px",
                textTransform: "uppercase",
                letterSpacing: "0.34em",
                fontWeight: 600,
                color: "hsl(44 78% 54%)",
              }}
            >
              One Connected Flow
            </span>
            <span style={{ display: "block", height: "1px", width: "36px", background: "hsl(44 78% 54%)" }} />
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
            From artisan hands to{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 400,
                background: "linear-gradient(135deg, hsl(44 78% 68%), hsl(40 62% 52%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              your wardrobe
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
            Aivestire is one path: artisans create, the platform preserves their story, technology makes each piece understandable, and the right buyer connects with confidence. Click a card to explore.
          </p>
        </div>

        {/* ── 2×2 Story Card Grid ── */}
        <div data-gsap-group="story-grid" className="relative grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-10 bottom-10 hidden w-px -translate-x-1/2 md:block"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.42), transparent)",
            }}
          />
          {storyCards.map((card) => (
            <StoryCard
              key={card.id}
              card={card}
              isActive={activeCard === card.id}
              onClick={() => handleCardClick(card.id)}
            />
          ))}
        </div>

        {/* ── Expand Panel ── */}
        <ExpandPanel
          cardId={activeCard}
          accentRgb={activeCardData?.accentRgb ?? "212,175,55"}
          isOpen={activeCard !== null}
        />
      </div>
    </section>
  );
};
