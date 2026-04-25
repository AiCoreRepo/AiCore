import { Sparkles, Upload, Scan, Wand2 } from "lucide-react";
import { cloudinaryImages } from "@/constants/cloudinaryImages";

const ArtisanSection = () => {
  return (
    <div id="section-artisans" data-gsap-group="split-section" className="py-24 relative overflow-hidden" style={{ background: "hsl(30 14% 10%)" }}>
      <div className="container-luxury relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div data-gsap="split-copy-left">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
              <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>The Artisans</span>
            </div>
            <h2 className="font-serif text-4xl lg:text-5xl text-[#F8F2E9] leading-tight mb-8">
              Every thread carries a <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>story of generations</em>.
            </h2>
            <p className="text-[#F8F2E9]/60 leading-relaxed mb-8">
              We partner directly with masterful creators in Jaipur—block-printers, weavers, and embroiderers who have preserved these heritage crafts. Aivestire brings their art to the global stage, ensuring fair recognition and direct connection with buyers who value true craftsmanship.
            </p>
            <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.2)" }}>
              <p className="text-[#F8F2E9]/80 italic mb-4">"This platform gave my work a global audience, allowing my family's legacy to thrive in the modern world."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src={cloudinaryImages.avatars.artisan1} alt="Artisan" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-sm text-[#F8F2E9] font-medium">Rajendra Kumar</div>
                  <div className="text-xs text-[#F8F2E9]/40 uppercase tracking-widest mt-1">Master Weaver</div>
                </div>
              </div>
            </div>
          </div>
          <div data-gsap="split-media-right" className="grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-12">
              <div data-gsap="media-reveal" className="overflow-hidden rounded-2xl">
                <img data-gsap="media-image" src={cloudinaryImages.stories.jaipurBwEmbroidery} alt="Embroidery" className="w-full rounded-2xl object-cover h-[280px]" style={{ filter: "brightness(0.85)" }} />
              </div>
              <div data-gsap="media-reveal" className="overflow-hidden rounded-2xl">
                <img data-gsap="media-image" src={cloudinaryImages.stories.jaipurWomenGroup} alt="Artisans" className="w-full rounded-2xl object-cover h-[200px]" style={{ filter: "brightness(0.85)" }} />
              </div>
            </div>
            <div className="space-y-4">
              <div data-gsap="media-reveal" className="overflow-hidden rounded-2xl">
                <img data-gsap="media-image" src={cloudinaryImages.stories.jaipurTextileMarket} alt="Textile Market" className="w-full rounded-2xl object-cover h-[240px]" style={{ filter: "brightness(0.85)" }} />
              </div>
              <div data-gsap="media-reveal" className="overflow-hidden rounded-2xl">
                <img data-gsap="media-image" src={cloudinaryImages.stories.jaipurArtisansThread} alt="Thread Work" className="w-full rounded-2xl object-cover h-[240px]" style={{ filter: "brightness(0.85)" }} />
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
    <div id="section-tryon" data-gsap-group="split-section" className="py-24 relative overflow-hidden" style={{ background: "hsl(30 14% 12%)" }}>
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
      <div className="container-luxury relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Mockup Image */}
          <div data-gsap="split-media-left" className="order-2 lg:order-1 relative group perspective-1000">
            <div data-gsap="media-reveal" className="relative z-10 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
              <img data-gsap="media-image" src={cloudinaryImages.tryOnNew} alt="Virtual Try On" className="w-full h-auto object-cover" />
            </div>
            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#D4AF37]/20 blur-[120px] rounded-full" />
          </div>

          {/* Right: Story & Steps */}
          <div data-gsap="split-copy-right" className="order-1 lg:order-2 max-w-xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>Virtual Try-On</span>
              <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
            </div>
            <h2 className="font-serif text-4xl lg:text-5xl text-[#F8F2E9] leading-tight mb-6">
              See it before you <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>wear it</em>
            </h2>
            <p className="text-[#F8F2E9]/60 mb-12 text-lg">
              We bridge the gap between imagination and reality. Our advanced AI seamlessly maps complex heritage garments onto your exact body shape, ensuring you buy with absolute confidence.
            </p>

            {/* Vertical Stepper */}
            <div data-gsap-group="steps" className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#D4AF37]/50 before:via-[#D4AF37]/20 before:to-transparent">
              <div data-gsap="step-item" className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#D4AF37] bg-black text-[#D4AF37] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_20px_rgba(212,175,55,0.3)] z-10">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
                  <h3 className="font-semibold text-[#F8F2E9] mb-1">1. Upload Image</h3>
                  <p className="text-sm text-[#F8F2E9]/60">Provide a clear, front-facing photo of yourself in casual wear.</p>
                </div>
              </div>

              <div data-gsap="step-item" className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-black text-white/60 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:border-[#D4AF37] group-hover:text-[#D4AF37]">
                  <Scan className="w-5 h-5" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-colors group-hover:bg-white/5">
                  <h3 className="font-semibold text-[#F8F2E9] mb-1">2. AI Processing</h3>
                  <p className="text-sm text-[#F8F2E9]/60">Our system maps the 3D drape and intricate embroidery to your proportions.</p>
                </div>
              </div>

              <div data-gsap="step-item" className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-black text-white/60 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:border-[#D4AF37] group-hover:text-[#D4AF37]">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-colors group-hover:bg-white/5">
                  <h3 className="font-semibold text-[#F8F2E9] mb-1">3. Visualize</h3>
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
  { id: 1, name: "Block-Printed Silk Dress", score: "98% Match", image: cloudinaryImages.products[1] },
  { id: 2, name: "Zardozi Velvet Lehenga", score: "96% Match", image: cloudinaryImages.products[2] },
  { id: 3, name: "Chikankari Kurti Set", score: "95% Match", image: cloudinaryImages.products[3] },
  { id: 4, name: "Banarasi Heritage Saree", score: "99% Match", image: cloudinaryImages.products[4] },
];

const RecommendationSection = () => {
  return (
    <div id="section-recommendation" data-gsap-group="split-section" className="py-24 relative overflow-hidden" style={{ background: "hsl(30 14% 10%)" }}>
      <div className="container-luxury relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text */}
          <div data-gsap="split-copy-left" className="order-1 lg:pr-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>Recommendations</span>
              <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
            </div>
            <h2 className="font-serif text-4xl lg:text-5xl text-[#F8F2E9] leading-tight mb-8">
              Styled just <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>for you</em>.
            </h2>
            <p className="text-[#F8F2E9]/60 leading-relaxed text-lg">
              Forget endless scrolling. Our AI learns your preferences, past choices, and Aura profile to curate a hyper-personalized feed. From everyday elegance to occasion-specific heritage wear, discover pieces that resonate with your unique aesthetic.
            </p>
          </div>

          {/* Image Feed */}
          <div data-gsap="split-media-right" className="order-2 relative lg:pl-8">
            <div data-gsap="media-reveal" className="relative z-10 rounded-3xl p-6 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-[#F8F2E9] font-medium text-sm">AI Stylist Picks For You</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {AI_PICKS.map((item) => (
                  <div data-gsap="pick-card" data-gsap-hover="lift-card" key={item.id} className="rounded-xl overflow-hidden bg-white/5 border border-white/5 pb-3 transition-all hover:-translate-y-1 hover:bg-white/10 group cursor-pointer">
                    <div className="relative h-48 md:h-56 w-full overflow-hidden mb-3">
                      <img data-gsap="pick-image" src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
  { name: "Minimal", desc: "Clean lines & monochrome", img: cloudinaryImages.auras.minimal },
  { name: "Bold", desc: "Vibrant & contemporary", img: cloudinaryImages.auras.bold },
  { name: "Heritage", desc: "Classic & royal elegance", img: cloudinaryImages.auras.heritage },
  { name: "Avant-Garde", desc: "Experimental fusion", img: cloudinaryImages.auras.avantGarde },
];

const AuraSection = () => {
  return (
    <div id="section-aura" data-gsap-group="split-section" className="py-24 relative overflow-hidden" style={{ background: "hsl(30 14% 8%)" }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)]" />
      <div className="container-luxury relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Aura Grid (Image Left) */}
          <div data-gsap="split-media-left" className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              {AURAS.map((aura) => (
                <div data-gsap="aura-card" data-gsap-hover="lift-card" key={aura.name} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-[3/4] cursor-pointer">
                  <img data-gsap="aura-image" src={aura.img} alt={aura.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: "brightness(0.85)" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4 w-full text-left">
                    <h3 className="font-serif text-xl text-[#F8F2E9] mb-1">{aura.name}</h3>
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
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>Your Aura</span>
              <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
            </div>
            <h2 className="font-serif text-4xl lg:text-5xl text-[#F8F2E9] leading-tight mb-8">
              Your Style Has an <em className="italic" style={{ color: "hsl(44 78% 68%)" }}>Identity</em>
            </h2>
            <p className="text-[#F8F2E9]/60 leading-relaxed text-lg mb-8">
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
