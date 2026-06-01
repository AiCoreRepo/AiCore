import { Link } from "react-router-dom";
import { Brush, Sparkles, HeartHandshake } from "lucide-react";
import { IMG } from "@/constants/cloudinary-images";

export const ValueFlowSection = () => {
  return (
    <section
      id="about"
      className="py-16 sm:py-20 lg:py-32"
      style={{
        background: "hsl(30 14% 10%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="container-luxury max-w-5xl">
        {/* Header */}
        <div
          data-gsap="section-heading"
          className="mb-12 text-center sm:mb-16 lg:mb-20"
        >
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="h-px w-8 block" style={{ background: "hsl(44 78% 54%)" }} />
            <span className="text-[10px] uppercase tracking-[0.48em] font-semibold" style={{ color: "hsl(44 78% 54%)" }}>
              The Aivestire Ecosystem
            </span>
            <span className="h-px w-8 block" style={{ background: "hsl(44 78% 54%)" }} />
          </div>
          <h2
            className="font-serif"
            style={{ fontSize: "clamp(1.9rem, 3.5vw, 3rem)", color: "hsl(40 30% 90%)", lineHeight: 1.12 }}
          >
            A bridge between <em className="italic text-[#D4AF37]">heritage & tomorrow</em>
          </h2>
        </div>

        {/* Storytelling Grid */}
        <div data-gsap-group="ecosystem-grid" className="mb-12 grid grid-cols-1 gap-5 sm:mb-16 sm:gap-6 md:grid-cols-3 md:gap-8 lg:mb-24">
          {/* Card 1: Creators */}
          <div data-gsap="ecosystem-card" data-gsap-hover="lift-card" className="group relative flex flex-col items-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 xs:p-6 sm:p-8 text-center transition-transform duration-500 hover:-translate-y-2">
            <div className="mb-4 h-32 xs:h-40 sm:h-48 w-full overflow-hidden rounded-xl">
              <img data-gsap="ecosystem-image" src={IMG.jaipurArtisansThread} alt="Creators" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ filter: "brightness(0.85)" }} />
            </div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-white/10 sm:mb-6 sm:h-14 sm:w-14">
              <Brush className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <h3 className="mb-3 font-serif text-[1.45rem] text-[#F8F2E9] sm:mb-4 sm:text-2xl">The Creators</h3>
            <p className="text-[#F8F2E9]/60 leading-relaxed text-sm">
              Our platform empowers master artisans in Jaipur, giving their generations-old craftsmanship a global digital stage. We ensure fair recognition and value for every thread.
            </p>
          </div>

          {/* Card 2: The Bridge (AI) */}
          <div data-gsap="ecosystem-card" data-gsap-hover="lift-card" className="group relative flex translate-y-0 flex-col items-center overflow-hidden rounded-[2rem] border border-[#D4AF37]/30 bg-gradient-to-b from-[#D4AF37]/10 to-transparent p-5 xs:p-6 sm:p-8 text-center shadow-[0_0_40px_rgba(212,175,55,0.08)] transition-transform duration-500 hover:-translate-y-2 lg:translate-y-8">
            <div className="relative mb-4 h-32 xs:h-40 sm:h-48 w-full overflow-hidden rounded-xl">
              <img data-gsap="ecosystem-image" src={IMG.aiBridge} alt="The Bridge" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ filter: "brightness(0.9)" }} />
              <div className="absolute inset-0 bg-[#D4AF37]/20 mix-blend-overlay" />
            </div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.3)] sm:mb-6 sm:h-16 sm:w-16">
              <Sparkles className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h3 className="mb-3 font-serif text-[1.45rem] text-[#D4AF37] sm:mb-4 sm:text-2xl">The AI Bridge</h3>
            <p className="text-[#F8F2E9]/80 leading-relaxed text-sm">
              Through cutting-edge AI, we digitize heritage fashion. We translate physical artistry into immersive digital experiences, virtual try-ons, and hyper-personalized aura matches.
            </p>
          </div>

          {/* Card 3: The Users */}
          <div data-gsap="ecosystem-card" data-gsap-hover="lift-card" className="group relative flex flex-col items-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 xs:p-6 sm:p-8 text-center transition-transform duration-500 hover:-translate-y-2">
            <div className="mb-4 h-32 xs:h-40 sm:h-48 w-full overflow-hidden rounded-xl">
              <img data-gsap="ecosystem-image" src={IMG.jaipurWomenGroup} alt="Users" className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110" style={{ filter: "brightness(0.85)" }} />
            </div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-white/10 sm:mb-6 sm:h-14 sm:w-14">
              <HeartHandshake className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <h3 className="mb-3 font-serif text-[1.45rem] text-[#F8F2E9] sm:mb-4 sm:text-2xl">The Users</h3>
            <p className="text-[#F8F2E9]/60 leading-relaxed text-sm">
              You don't just wear an outfit; you inherit a story. Discover perfectly fitted, ethically sourced heritage fashion that aligns seamlessly with your unique style identity.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div data-gsap="cta-pill" className="flex justify-center">
          <Link
            to="/login"
            data-gsap-hover="magnetic-strong"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold transition-all hover:scale-[1.03] sm:w-auto sm:px-8"
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.28em",
              background: "linear-gradient(135deg, hsl(44 78% 56%), hsl(40 62% 44%))",
              color: "hsl(30 14% 10%)",
            }}
          >
            Join the Ecosystem
          </Link>
        </div>
      </div>
    </section>
  );
};
