import { Sparkles, Upload, Scan, Wand2 } from "lucide-react";
import { IMG } from "@/constants/cloudinary-images";

const ArtisanSection = () => {
  return (
    <div id="section-artisans" data-gsap-group="split-section" className="relative overflow-hidden py-16 sm:py-20 lg:py-24" style={{ background: "hsl(30 14% 10%)" }}>
      <div className="container-luxury relative z-10">
        <div className="grid grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          <div data-gsap="split-copy-left">
            <div className="mb-5 inline-flex items-center gap-3 sm:mb-6">
              <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
              <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>The Artisans</span>
            </div>
            <h2 className="mb-6 font-serif text-3xl leading-tight text-[#F8F2E9] sm:mb-8 sm:text-4xl lg:text-5xl">
              Every thread carries a <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>story of generations</em>.
            </h2>
            <p className="mb-6 text-base leading-relaxed text-[#F8F2E9]/60 sm:mb-8 sm:text-lg">
              We partner directly with masterful creators in Jaipur—block-printers, weavers, and embroiderers who have preserved these heritage crafts. Aivestire brings their art to the global stage, ensuring fair recognition and direct connection with buyers who value true craftsmanship.
            </p>
            <div className="rounded-2xl p-5 sm:p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.2)" }}>
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
          <div data-gsap="split-media-right" className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-3 pt-6 sm:space-y-4 sm:pt-12">
              <div data-gsap="media-reveal" className="overflow-hidden rounded-2xl">
                <img data-gsap="media-image" src={IMG.jaipurBwEmbroidery} alt="Embroidery" className="h-[180px] w-full rounded-2xl object-cover xs:h-[220px] sm:h-[280px]" style={{ filter: "brightness(0.85)" }} />
              </div>
              <div data-gsap="media-reveal" className="overflow-hidden rounded-2xl">
                <img data-gsap="media-image" src={IMG.jaipurWomenGroup} alt="Artisans" className="h-[150px] w-full rounded-2xl object-cover xs:h-[170px] sm:h-[200px]" style={{ filter: "brightness(0.85)" }} />
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div data-gsap="media-reveal" className="overflow-hidden rounded-2xl">
                <img data-gsap="media-image" src={IMG.jaipurTextileMarket} alt="Textile Market" className="h-[170px] w-full rounded-2xl object-cover xs:h-[200px] sm:h-[240px]" style={{ filter: "brightness(0.85)" }} />
              </div>
              <div data-gsap="media-reveal" className="overflow-hidden rounded-2xl">
                <img data-gsap="media-image" src={IMG.jaipurArtisansThread} alt="Thread Work" className="h-[170px] w-full rounded-2xl object-cover xs:h-[200px] sm:h-[240px]" style={{ filter: "brightness(0.85)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TryOnSection = () => {
  return (
    <div id="section-tryon" data-gsap-group="split-section" className="relative overflow-hidden py-16 sm:py-20 lg:py-24" style={{ background: "hsl(30 14% 12%)" }}>
      <div data-gsap="ambient-orb" data-gsap-drift="26" className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
      <div className="container-luxury relative z-10">
        <div className="grid grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Mockup Image */}
          <div data-gsap="split-media-left" className="order-2 lg:order-1 relative group perspective-1000">
            <div data-gsap="media-reveal" className="relative z-10 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
              <img data-gsap="media-image" src={IMG.tryonRealistic} alt="Virtual Try On" className="w-full h-auto object-cover" />
            </div>
            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#D4AF37]/20 blur-[120px] rounded-full" />
          </div>

          {/* Right: Story & Steps */}
          <div data-gsap="split-copy-right" className="order-1 lg:order-2 max-w-xl">
            <div className="mb-5 inline-flex items-center gap-3 sm:mb-6">
              <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>Virtual Try-On</span>
              <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
            </div>
            <h2 className="mb-5 font-serif text-3xl leading-tight text-[#F8F2E9] sm:mb-6 sm:text-4xl lg:text-5xl">
              See it before you <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>wear it</em>
            </h2>
            <p className="mb-8 text-base text-[#F8F2E9]/60 sm:mb-12 sm:text-lg">
              We bridge the gap between imagination and reality. Our advanced AI seamlessly maps complex heritage garments onto your exact body shape, ensuring you buy with absolute confidence.
            </p>

            {/* Vertical Stepper */}
            <div data-gsap-group="steps" className="relative space-y-6 sm:space-y-8">
              <div className="pointer-events-none absolute inset-y-0 left-5 w-0.5 -translate-x-px bg-gradient-to-b from-white/18 via-white/10 to-transparent sm:left-6 md:left-1/2 md:-translate-x-1/2" />
              <div
                data-gsap="step-line-fill"
                className="pointer-events-none absolute inset-y-0 left-5 w-0.5 origin-top -translate-x-px bg-gradient-to-b from-[#D4AF37] via-[#E7C870] to-transparent sm:left-6 md:left-1/2 md:-translate-x-1/2"
              />
              <div data-gsap="step-item" className="group is-active relative flex items-start gap-3 sm:gap-4 md:items-center md:justify-normal md:odd:flex-row-reverse">
                <div data-gsap="step-node" className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[linear-gradient(145deg,rgba(231,200,112,0.96)_0%,rgba(212,175,55,0.88)_100%)] text-[#0f0b09] shadow-[0_0_0_6px_rgba(212,175,55,0.08),0_0_26px_rgba(212,175,55,0.34)] sm:h-12 sm:w-12 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div data-gsap="step-copy" className="w-[calc(100%-3.25rem)] rounded-[1.15rem] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] px-4 py-4 shadow-[0_18px_36px_rgba(0,0,0,0.18)] backdrop-blur-md sm:w-[calc(100%-4rem)] sm:px-5 md:w-[calc(50%-3rem)]">
                  <div className="mb-3 flex items-center gap-3">
                    <span data-gsap="step-badge" className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white">
                      01
                    </span>
                    <h3 className="font-semibold text-white">Upload Image</h3>
                  </div>
                  <p className="text-sm text-[#F8F2E9]/60">Provide a clear, front-facing photo of yourself in casual wear.</p>
                </div>
              </div>

              <div data-gsap="step-item" className="group is-active relative flex items-start gap-3 sm:gap-4 md:items-center md:justify-normal md:odd:flex-row-reverse">
                <div data-gsap="step-node" className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/24 bg-[linear-gradient(145deg,rgba(17,17,17,0.96)_0%,rgba(28,28,28,0.92)_100%)] text-white/78 shadow-[0_0_0_6px_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.24)] transition-colors group-hover:border-[#D4AF37] group-hover:text-white sm:h-12 sm:w-12 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <Scan className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div data-gsap="step-copy" className="w-[calc(100%-3.25rem)] rounded-[1.15rem] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.055)_0%,rgba(255,255,255,0.02)_100%)] px-4 py-4 shadow-[0_18px_36px_rgba(0,0,0,0.14)] backdrop-blur-md transition-colors group-hover:border-white/16 group-hover:bg-[linear-gradient(155deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] sm:w-[calc(100%-4rem)] sm:px-5 md:w-[calc(50%-3rem)]">
                  <div className="mb-3 flex items-center gap-3">
                    <span data-gsap="step-badge" className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white">
                      02
                    </span>
                    <h3 className="font-semibold text-white">AI Processing</h3>
                  </div>
                  <p className="text-sm text-[#F8F2E9]/60">Our system maps the 3D drape and intricate embroidery to your proportions.</p>
                </div>
              </div>

              <div data-gsap="step-item" className="group is-active relative flex items-start gap-3 sm:gap-4 md:items-center md:justify-normal md:odd:flex-row-reverse">
                <div data-gsap="step-node" className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/24 bg-[linear-gradient(145deg,rgba(17,17,17,0.96)_0%,rgba(28,28,28,0.92)_100%)] text-white/78 shadow-[0_0_0_6px_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.24)] transition-colors group-hover:border-[#D4AF37] group-hover:text-white sm:h-12 sm:w-12 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div data-gsap="step-copy" className="w-[calc(100%-3.25rem)] rounded-[1.15rem] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.055)_0%,rgba(255,255,255,0.02)_100%)] px-4 py-4 shadow-[0_18px_36px_rgba(0,0,0,0.14)] backdrop-blur-md transition-colors group-hover:border-white/16 group-hover:bg-[linear-gradient(155deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] sm:w-[calc(100%-4rem)] sm:px-5 md:w-[calc(50%-3rem)]">
                  <div className="mb-3 flex items-center gap-3">
                    <span data-gsap="step-badge" className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white">
                      03
                    </span>
                    <h3 className="font-semibold text-white">Visualize</h3>
                  </div>
                  <p className="text-sm text-[#F8F2E9]/60">Instantly see the exact look and fit before making a purchase.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AI_PICKS = [
  { id: 1, name: "Block-Printed Silk Dress", score: "98% Match", src: IMG.product1 },
  { id: 2, name: "Zardozi Velvet Lehenga", score: "96% Match", src: IMG.product2 },
  { id: 3, name: "Chikankari Kurti Set", score: "95% Match", src: IMG.product3 },
  { id: 4, name: "Banarasi Heritage Saree", score: "99% Match", src: IMG.product4 },
];

const RecommendationSection = () => {
  return (
    <div id="section-recommendation" data-gsap-group="split-section" className="relative overflow-hidden py-16 sm:py-20 lg:py-24" style={{ background: "hsl(30 14% 10%)" }}>
      <div className="container-luxury relative z-10">
        <div className="grid grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          
          {/* Text */}
          <div data-gsap="split-copy-left" className="order-1 lg:pr-8">
            <div className="mb-5 inline-flex items-center gap-3 sm:mb-6">
              <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>Recommendations</span>
              <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
            </div>
            <h2 className="mb-6 font-serif text-3xl leading-tight text-[#F8F2E9] sm:mb-8 sm:text-4xl lg:text-5xl">
              Styled just <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>for you</em>.
            </h2>
            <p className="text-base leading-relaxed text-[#F8F2E9]/60 sm:text-lg">
              Forget endless scrolling. Our AI learns your preferences, past choices, and Aura profile to curate a hyper-personalized feed. From everyday elegance to occasion-specific heritage wear, discover pieces that resonate with your unique aesthetic.
            </p>
          </div>

          {/* Image Feed */}
          <div data-gsap="split-media-right" className="order-2 relative lg:pl-8">
            <div data-gsap="media-reveal" className="relative z-10 overflow-hidden rounded-[1.75rem] p-4 xs:p-5 sm:rounded-3xl sm:p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
              <div className="mb-5 flex items-center gap-3 sm:mb-6">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-[#F8F2E9] font-medium text-sm">AI Stylist Picks For You</span>
              </div>
              <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4">
                {AI_PICKS.map((item) => (
                  <div data-gsap="pick-card" data-gsap-hover="lift-card" key={item.id} className="rounded-xl overflow-hidden bg-white/5 border border-white/5 pb-3 transition-all hover:-translate-y-1 hover:bg-white/10 group cursor-pointer">
                    <div className="relative mb-3 h-52 w-full overflow-hidden xs:h-48 md:h-56">
                      <img data-gsap="pick-image" src={item.src} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-bold text-[#D4AF37] border border-[#D4AF37]/30">
                        {item.score}
                      </div>
                    </div>
                    <div className="px-3">
                      <div className="text-sm text-[#F8F2E9] font-medium truncate">{item.name}</div>
                      <div className="text-[10px] text-[#F8F2E9]/50 mt-1">Curated for your Aura</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4AF37]/20 blur-[100px] rounded-full" />
          </div>

        </div>
      </div>
    </div>
  );
};

const AURAS = [
  { name: "Minimal", desc: "Clean lines & monochrome", src: IMG.auraMinimal },
  { name: "Bold", desc: "Vibrant & contemporary", src: IMG.auraBold },
  { name: "Heritage", desc: "Classic & royal elegance", src: IMG.auraHeritage },
  { name: "Avant-Garde", desc: "Experimental fusion", src: IMG.auraAvantGarde },
];

const AuraSection = () => {
  return (
    <div id="section-aura" data-gsap-group="split-section" className="relative overflow-hidden py-16 sm:py-20 lg:py-24" style={{ background: "hsl(30 14% 8%)" }}>
      <div data-gsap="ambient-orb" data-gsap-drift="24" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)]" />
      <div className="container-luxury relative z-10">
        <div className="grid grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          
          {/* Left: Aura Grid (Image Left) */}
          <div data-gsap="split-media-left" className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {AURAS.map((aura) => (
                <div data-gsap="aura-card" data-gsap-hover="lift-card" key={aura.name} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-[3/4] cursor-pointer">
                  <img data-gsap="aura-image" src={aura.src} alt={aura.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: "brightness(0.85)" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-3 text-left sm:p-4">
                    <h3 className="mb-1 font-serif text-lg text-[#F8F2E9] sm:text-xl">{aura.name}</h3>
                    <p className="text-xs text-[#F8F2E9]/60">{aura.desc}</p>
                  </div>
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Text (Text Right) */}
          <div data-gsap="split-copy-right" className="order-1 lg:order-2 max-w-xl">
            <div className="mb-5 inline-flex items-center gap-3 sm:mb-6">
              <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>Your Aura</span>
              <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
            </div>
            <h2 className="mb-6 font-serif text-3xl leading-tight text-[#F8F2E9] sm:mb-8 sm:text-4xl lg:text-5xl">
              Your Style Has an <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>Identity</em>
            </h2>
            <p className="mb-8 text-base leading-relaxed text-[#F8F2E9]/60 sm:text-lg">
              Your Aura is your evolving digital style fingerprint. It captures the essence of your aesthetic—whether Minimal, Bold, or Heritage—and guides every interaction on Aivestire.
            </p>
          </div>

        </div>
      </div>
    </div>
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
