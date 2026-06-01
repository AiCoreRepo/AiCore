import { Scan, Sparkles, Upload, Wand2 } from "lucide-react";
import { IMG } from "@/constants/cloudinary-images";

const sectionTone = {
  warm: "#F8F4EC",
  soft: "#EFE7DA",
  ink: "#211B14",
  body: "#6A5F51",
  gold: "#A97C32",
  green: "#596D54",
};

const steps = [
  { icon: Upload, title: "Upload", body: "Start with one clear photo." },
  { icon: Scan, title: "Map", body: "AI reads fit, drape, and proportion." },
  { icon: Wand2, title: "Preview", body: "See the garment before checkout." },
];

const AI_PICKS = [
  { id: 1, name: "Block-printed silk", score: "98%", src: IMG.product1 },
  { id: 2, name: "Zardozi velvet", score: "96%", src: IMG.product2 },
  { id: 3, name: "Chikankari set", score: "95%", src: IMG.product3 },
  { id: 4, name: "Banarasi saree", score: "99%", src: IMG.product4 },
];

const AURAS = [
  { name: "Minimal", src: IMG.auraMinimal },
  { name: "Bold", src: IMG.auraBold },
  { name: "Heritage", src: IMG.auraHeritage },
  { name: "Avant-garde", src: IMG.auraAvantGarde },
];

const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 inline-flex items-center gap-3">
    <span className="h-px w-8" style={{ background: sectionTone.gold }} />
    <span className="text-xs font-bold uppercase" style={{ color: sectionTone.green }}>
      {children}
    </span>
  </div>
);

const ImageFrame = ({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) => (
  <div data-gsap="media-reveal" className={`overflow-hidden rounded-lg ${className}`}>
    <img
      data-gsap="media-image"
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  </div>
);

const ArtisanSection = () => {
  return (
    <section
      id="section-artisans"
      data-gsap-group="split-section"
      className="py-16 sm:py-20 lg:py-24"
      style={{ background: sectionTone.warm }}
    >
      <div className="container-luxury">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div data-gsap="split-copy-left">
            <SectionEyebrow>The artisans</SectionEyebrow>
            <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl" style={{ color: sectionTone.ink }}>
              Craft is the first technology.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 sm:text-lg" style={{ color: sectionTone.body }}>
              Aivestire starts with makers in Jaipur: fabric, embroidery, block print, cut, and finish. The platform keeps that story visible instead of hiding it behind generic product listings.
            </p>
          </div>

          <div data-gsap="split-media-right" className="grid grid-cols-2 gap-3 sm:gap-4">
            <ImageFrame src={IMG.storyLoomHands} alt="Artisan hands working on textile" className="h-72 sm:h-96" />
            <div className="grid gap-3 sm:gap-4">
              <ImageFrame src={IMG.jaipurBwEmbroidery} alt="Embroidery detail" className="h-36 sm:h-44" />
              <ImageFrame src={IMG.jaipurWomenGroup} alt="Jaipur artisan group" className="h-36 sm:h-44" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TryOnSection = () => {
  return (
    <section
      id="section-tryon"
      data-gsap-group="split-section"
      className="py-16 sm:py-20 lg:py-24"
      style={{ background: sectionTone.soft }}
    >
      <div className="container-luxury">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div data-gsap="split-media-left" className="order-2 lg:order-1">
            <ImageFrame src={IMG.tryonRealistic} alt="Virtual try-on preview" className="aspect-[4/5] max-h-[620px]" />
          </div>

          <div data-gsap="split-copy-right" className="order-1 lg:order-2">
            <SectionEyebrow>Virtual try-on</SectionEyebrow>
            <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl" style={{ color: sectionTone.ink }}>
              See the fit before you buy.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 sm:text-lg" style={{ color: sectionTone.body }}>
              The experience is direct: upload once, preview clearly, and make a more confident decision.
            </p>

            <div data-gsap-group="steps" className="mt-8 grid gap-3">
              {steps.map(({ icon: Icon, title, body }, index) => (
                <div
                  key={title}
                  data-gsap="step-item"
                  className="flex items-start gap-4 border-t border-[#211B14]/10 pt-4"
                >
                  <div data-gsap="step-node" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#211B14] text-[#F8F4EC]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div data-gsap="step-copy">
                    <p className="text-sm font-bold" style={{ color: sectionTone.ink }}>
                      {String(index + 1).padStart(2, "0")} · {title}
                    </p>
                    <p className="mt-1 text-sm leading-6" style={{ color: sectionTone.body }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const RecommendationSection = () => {
  return (
    <section
      id="section-recommendation"
      data-gsap-group="split-section"
      className="py-16 sm:py-20 lg:py-24"
      style={{ background: sectionTone.warm }}
    >
      <div className="container-luxury">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div data-gsap="split-copy-left">
            <SectionEyebrow>Recommendations</SectionEyebrow>
            <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl" style={{ color: sectionTone.ink }}>
              Less scrolling. Better matches.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 sm:text-lg" style={{ color: sectionTone.body }}>
              AI connects the product story with your style signals, so the collection feels curated instead of crowded.
            </p>
          </div>

          <div data-gsap="split-media-right" className="grid grid-cols-2 gap-3 sm:gap-4">
            {AI_PICKS.map((item) => (
              <article key={item.id} data-gsap="pick-card" className="overflow-hidden rounded-lg border border-[#211B14]/10 bg-white">
                <img data-gsap="pick-image" src={item.src} alt={item.name} className="aspect-[4/5] w-full object-cover" loading="lazy" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold" style={{ color: sectionTone.ink }}>{item.name}</p>
                    <span className="text-xs font-bold" style={{ color: sectionTone.gold }}>{item.score}</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: sectionTone.body }}>Aura match</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const AuraSection = () => {
  return (
    <section
      id="section-aura"
      data-gsap-group="split-section"
      className="py-16 sm:py-20 lg:py-24"
      style={{ background: sectionTone.soft }}
    >
      <div className="container-luxury">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div data-gsap="split-media-left" className="order-2 grid grid-cols-2 gap-3 sm:gap-4 lg:order-1">
            {AURAS.map((aura) => (
              <article key={aura.name} data-gsap="aura-card" className="overflow-hidden rounded-lg bg-white">
                <img data-gsap="aura-image" src={aura.src} alt={aura.name} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                <p className="p-4 text-sm font-semibold" style={{ color: sectionTone.ink }}>{aura.name}</p>
              </article>
            ))}
          </div>

          <div data-gsap="split-copy-right" className="order-1 lg:order-2">
            <SectionEyebrow>Your aura</SectionEyebrow>
            <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl" style={{ color: sectionTone.ink }}>
              A style profile that keeps learning.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 sm:text-lg" style={{ color: sectionTone.body }}>
              Your Aura helps Aivestire understand what suits you, what you return to, and what you are ready to try next.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: sectionTone.gold }}>
              <Sparkles className="h-4 w-4" />
              Built for personal discovery
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const StoryDetailSections = () => {
  return (
    <>
      <ArtisanSection />
      <TryOnSection />
      <RecommendationSection />
      <AuraSection />
    </>
  );
};
