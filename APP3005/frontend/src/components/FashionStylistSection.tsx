import { useEffect, useRef, useState } from "react";
import {
  Gem,
  ShoppingBag,
  Clock,
  Glasses,
  Crown,
  Layers,
  Zap,
  Sparkles,
  CircleDot,
  Shirt,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
interface Accessory {
  icon: LucideIcon;
  name: string;
  styleNote: string;
}

interface StylistData {
  tagline: string;
  accessories: Accessory[];
}

// ── Category → accessories map ─────────────────────────────────
function getStylistData(category: string, title: string): StylistData {
  const cat = (category + " " + title).toLowerCase();

  if (
    cat.includes("kurti") || cat.includes("kurta") ||
    cat.includes("anarkali") || cat.includes("salwar")
  ) {
    return {
      tagline: "Our fashion team says these pieces hit different together — the perfect ethnic-glam pairing ✨",
      accessories: [
        { icon: Gem,         name: "Jhumka Earrings",  styleNote: "The OG ethnic glam" },
        { icon: Zap,         name: "Kolhapuri Heels",  styleNote: "Walk like a vibe" },
        { icon: Layers,      name: "Silk Dupatta",      styleNote: "Layer up, queen" },
        { icon: ShoppingBag, name: "Potli Bag",         styleNote: "Tiny but iconic" },
        { icon: Star,        name: "Statement Bindi",   styleNote: "Tradition meets fashion" },
      ],
    };
  }
  if (cat.includes("saree") || cat.includes("sari")) {
    return {
      tagline: "Drip different — our stylists handpicked these to elevate your saree moment to its absolute peak 👑",
      accessories: [
        { icon: Crown,       name: "Maang Tikka",       styleNote: "Main character energy" },
        { icon: Zap,         name: "Heeled Sandals",    styleNote: "Elevate the whole look" },
        { icon: Gem,         name: "Stone Bangles",     styleNote: "Stack 'em, no cap" },
        { icon: Sparkles,    name: "Fresh Gajra",       styleNote: "Desi aesthetic unlocked" },
        { icon: ShoppingBag, name: "Embroidered Clutch",styleNote: "The finishing touch" },
      ],
    };
  }
  if (
    cat.includes("lehenga") || cat.includes("lehnga") ||
    cat.includes("chaniya") || cat.includes("ghagra")
  ) {
    return {
      tagline: "Lehenga season is the whole vibe — our stylists went all out for a look that's absolutely unreal 💅",
      accessories: [
        { icon: Crown,       name: "Maang Tikka",          styleNote: "Royalty, no cap" },
        { icon: Gem,         name: "Chandelier Earrings",  styleNote: "Go big or go home" },
        { icon: CircleDot,   name: "Stack Bangles",        styleNote: "More is more, always" },
        { icon: ShoppingBag, name: "Embroidered Clutch",   styleNote: "Match the motif" },
        { icon: Zap,         name: "Block Heeled Sandals", styleNote: "Comfort + attitude" },
      ],
    };
  }
  if (
    cat.includes("dress") || cat.includes("gown") ||
    cat.includes("midi")  || cat.includes("maxi")
  ) {
    return {
      tagline: "This dress slays on its own — but our stylists found the extras that take it to another level entirely 🔥",
      accessories: [
        { icon: CircleDot,   name: "Hoop Earrings",    styleNote: "Classic never misses" },
        { icon: Zap,         name: "Strappy Heels",    styleNote: "Leg moment incoming" },
        { icon: ShoppingBag, name: "Mini Handbag",     styleNote: "Tiny bag, big impact" },
        { icon: Gem,         name: "Bracelet Stack",   styleNote: "Layer up the wrists" },
        { icon: Glasses,     name: "Sleek Sunglasses", styleNote: "Cool girl era" },
      ],
    };
  }
  if (
    cat.includes("top") || cat.includes("blouse") ||
    cat.includes("shirt") || cat.includes("tee") || cat.includes("crop")
  ) {
    return {
      tagline: "The top is giving main character — our stylists stacked the right accessories to make this iconic 🌟",
      accessories: [
        { icon: Gem,         name: "Layered Necklace", styleNote: "Stack the neck, always" },
        { icon: Zap,         name: "Chunky Sneakers",  styleNote: "Street cred unlocked" },
        { icon: ShoppingBag, name: "Canvas Tote Bag",  styleNote: "Effortless cool" },
        { icon: Star,        name: "Ear Cuffs",        styleNote: "No piercing? No problem" },
        { icon: Clock,       name: "Minimalist Watch", styleNote: "Boss fit, always" },
      ],
    };
  }
  if (
    cat.includes("jeans") || cat.includes("trouser") ||
    cat.includes("pant") || cat.includes("denim")
  ) {
    return {
      tagline: "These pants are the canvas — our fashion team knows exactly how to complete this painting 🎨",
      accessories: [
        { icon: Shirt,       name: "Statement Belt",   styleNote: "Cinch that waist" },
        { icon: Zap,         name: "White Sneakers",   styleNote: "Zero-miss energy" },
        { icon: ShoppingBag, name: "Crossbody Bag",    styleNote: "Hands-free, always chic" },
        { icon: CircleDot,   name: "Hoop Earrings",    styleNote: "Keep it effortless" },
        { icon: Clock,       name: "Minimalist Watch", styleNote: "Time + style, on point" },
      ],
    };
  }
  if (
    cat.includes("jacket") || cat.includes("coat") ||
    cat.includes("blazer") || cat.includes("shrug")
  ) {
    return {
      tagline: "Jacket on = full power move. Our stylists layered these picks for a look that's lowkey editorial 📸",
      accessories: [
        { icon: Layers,      name: "Luxe Scarf",      styleNote: "Texture + warmth = fit" },
        { icon: Zap,         name: "Ankle Boots",     styleNote: "Streets are yours" },
        { icon: ShoppingBag, name: "Structured Bag",  styleNote: "Carry it with authority" },
        { icon: Gem,         name: "Chain Necklace",  styleNote: "Peek-a-boo drip" },
        { icon: Crown,       name: "Fitted Cap",      styleNote: "Casual but intentional" },
      ],
    };
  }
  return {
    tagline: "Every great outfit deserves the perfect finish — our stylist team curated these pieces just for this look ✨",
    accessories: [
      { icon: Gem,         name: "Statement Earrings", styleNote: "Start here, always" },
      { icon: Zap,         name: "Heeled Sandals",     styleNote: "Elevate everything" },
      { icon: ShoppingBag, name: "Chic Handbag",       styleNote: "Arm candy you deserve" },
      { icon: CircleDot,   name: "Ring Stack",          styleNote: "Fingers need love too" },
      { icon: Glasses,     name: "Sunglasses",          styleNote: "Cool girl, always" },
    ],
  };
}

// ── Component ──────────────────────────────────────────────────
interface FashionStylistSectionProps {
  category: string;
  title: string;
}

export const FashionStylistSection = ({
  category,
  title,
}: FashionStylistSectionProps) => {
  const { tagline, accessories } = getStylistData(category, title);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="mt-12"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.65s ease, transform 0.65s ease",
      }}
    >
      {/* ── Golden Banner Header ───────────────────────────── */}
      <div
        className="rounded-2xl px-6 py-7 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{
          background: "linear-gradient(120deg, #7c5c00 0%, #D4AF37 45%, #f5d87a 70%, #D4AF37 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-[11px] font-semibold uppercase tracking-widest leading-none mb-0.5">
              Aivestire Fashion Team
            </p>
            <h2 className="text-white text-xl sm:text-2xl font-bold leading-tight">
              Complete the Look 💫
            </h2>
          </div>
        </div>
        <p className="text-white/90 text-sm sm:text-base max-w-sm leading-relaxed sm:text-right">
          {tagline}
        </p>
      </div>

      {/* ── Accessory Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {accessories.map((acc, i) => {
          const Icon = acc.icon;
          return (
            <div
              key={acc.name}
              className="group flex flex-col items-center text-center rounded-xl border border-gray-200 bg-white px-3 py-5
                         hover:border-[#D4AF37] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.5s ease ${0.15 + i * 0.08}s, transform 0.5s ease ${0.15 + i * 0.08}s,
                             box-shadow 0.2s ease, border-color 0.2s ease, translate 0.2s ease`,
              }}
            >
              {/* Icon circle */}
              <div className="w-12 h-12 rounded-full bg-[#FEF9F0] flex items-center justify-center mb-3
                              group-hover:bg-[#D4AF37] transition-colors duration-200">
                <Icon className="w-5 h-5 text-[#D4AF37] group-hover:text-white transition-colors duration-200" />
              </div>

              <p className="text-sm font-bold text-gray-900 leading-snug mb-1">{acc.name}</p>
              <p className="text-[11px] text-gray-500 leading-tight">{acc.styleNote}</p>
            </div>
          );
        })}
      </div>

      {/* ── Subtle footer note ─────────────────────────────── */}
      <p className="text-center text-xs text-gray-400 pb-2">
        ✦ &nbsp;Personally curated by our in-house Aivestire fashion stylists — because every outfit deserves its perfect match.
      </p>
    </section>
  );
};

export default FashionStylistSection;
