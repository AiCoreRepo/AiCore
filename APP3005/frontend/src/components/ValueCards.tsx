import { ArrowRight } from "lucide-react";
import { IMG } from "@/constants/cloudinary-images";

/* ─── STORY CARD DATA ─────────────────────────────────────── */
const storyCards = [
  {
    id: "artisans",
    scrollTo: "#section-artisans",
    number: "01",
    category: "Artisans",
    title: "Craft starts with artisans",
    tagline: "Hands, fabric, motifs, and skill come first.",
    image: IMG.storyLoomHands,
  },
  {
    id: "tryon",
    scrollTo: "#section-tryon",
    number: "02",
    category: "Our Platform",
    title: "We give craft a clean stage",
    tagline: "Creators get context, visibility, and trust.",
    image: IMG.jaipurTextileMarket,
  },
  {
    id: "recommendation",
    scrollTo: "#section-recommendation",
    number: "03",
    category: "Technology",
    title: "Technology makes it personal",
    tagline: "AI connects fit, skin tone, style, and try-on.",
    image: IMG.aiBridge,
  },
  {
    id: "aura",
    scrollTo: "#section-aura",
    number: "04",
    category: "Connection",
    title: "The right buyer finds the piece",
    tagline: "A smoother bridge from maker to wardrobe.",
    image: IMG.jaipurShopWomen,
  },
];

/* ─── STORY CARD COMPONENT ────────────────────────────────── */
const StoryCard = ({
  card,
}: {
  card: (typeof storyCards)[0];
}) => {
  const handleClick = () => {
    const el = document.querySelector(card.scrollTo);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      data-gsap="story-card"
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-white transition-colors duration-300 hover:border-[#A97C32]/40"
      role="button"
      tabIndex={0}
      style={{
        borderColor: "rgba(42, 37, 29, 0.1)",
        boxShadow: "0 14px 40px rgba(34, 29, 21, 0.07)",
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#E7E1D4]">
        <img
          data-gsap="story-card-bg"
          src={card.image}
          alt={card.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      <div data-gsap="story-card-content" className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span
            className="font-serif"
            style={{
              fontSize: "1.25rem",
              color: "#A97C32",
              lineHeight: 1,
            }}
          >
            {card.number}
          </span>
          <span
            className="rounded-full border px-3 py-1"
            style={{
              fontSize: "0.62rem",
              textTransform: "uppercase",
              color: "#596D54",
              borderColor: "rgba(89, 109, 84, 0.22)",
              background: "rgba(89, 109, 84, 0.07)",
              fontWeight: 700,
            }}
          >
            {card.category}
          </span>
        </div>

        <h3
          className="mb-3 font-serif text-[1.25rem] leading-tight text-[#211B14] sm:text-[1.35rem]"
          style={{ fontWeight: 500 }}
        >
          {card.title}
        </h3>

        <p className="mb-6 text-sm leading-6 text-[#6A5F51]">
          {card.tagline}
        </p>

        <div className="mt-auto inline-flex items-center gap-2 text-xs font-bold uppercase text-[#A97C32] transition-transform duration-300 group-hover:translate-x-1">
          Read more
          <ArrowRight className="h-3.5 w-3.5" />
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
      className="relative overflow-hidden py-16 sm:py-20 lg:py-28"
      style={{
        background: "#F4F0E8",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(169,124,50,0.35), transparent)",
        }}
      />

      <div className="container-luxury relative">
        {/* ── Section Header ── */}
        <div
          data-gsap="section-heading"
          className="mb-10 max-w-3xl sm:mb-12 lg:mb-14"
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                display: "block",
                height: "1px",
                width: "28px",
                background: "#A97C32",
              }}
            />
            <span
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                fontWeight: 800,
                color: "#596D54",
              }}
            >
              One Connected Flow
            </span>
            <span
              style={{
                display: "block",
                height: "1px",
                width: "28px",
                background: "#A97C32",
              }}
            />
          </div>

          <h2
            className="font-serif text-4xl font-medium leading-tight text-[#211B14] sm:text-5xl"
            style={{
              marginBottom: "16px",
            }}
          >
            From artisan hands to{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 400,
                color: "#A97C32",
              }}
            >
              your wardrobe
            </em>
          </h2>

          <p
            style={{
              fontSize: "1rem",
              color: "#6A5F51",
              maxWidth: "44rem",
              lineHeight: 1.75,
            }}
          >
            Aivestire is one path: artisans create, the platform gives their work a clear home, technology makes the choice personal, and buyers connect with confidence.
          </p>
        </div>

        {/* ── 2×2 Story Card Grid ── */}
        <div data-gsap-group="story-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {storyCards.map((card) => (
            <StoryCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
};
