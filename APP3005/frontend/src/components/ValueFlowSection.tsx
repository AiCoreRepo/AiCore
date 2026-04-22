import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Brush, Sparkles, HeartHandshake } from "lucide-react";

export const ValueFlowSection = () => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="about"
      style={{
        background: "hsl(30 14% 10%)",
        padding: "8rem 0",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="container-luxury max-w-5xl">
        {/* Header */}
        <div
          className="text-center mb-20"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          <div className="inline-flex items-center gap-3 mb-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {/* Card 1: Creators */}
          <div className="group relative rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 flex flex-col items-center text-center p-8 transition-transform duration-500 hover:-translate-y-2">
            <div className="w-full h-48 rounded-xl overflow-hidden mb-6">
              <img src="/images/story-loom-hands.png" alt="Creators" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ filter: "brightness(0.85)" }} />
            </div>
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-6 border border-[#D4AF37]/30">
              <Brush className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <h3 className="font-serif text-2xl text-[#F8F2E9] mb-4">The Creators</h3>
            <p className="text-[#F8F2E9]/60 leading-relaxed text-sm">
              Our platform empowers master artisans in Jaipur, giving their generations-old craftsmanship a global digital stage. We ensure fair recognition and value for every thread.
            </p>
          </div>

          {/* Card 2: The Bridge (AI) */}
          <div className="group relative rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 flex flex-col items-center text-center p-8 transition-transform duration-500 hover:-translate-y-2 translate-y-0 md:translate-y-8 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
            <div className="w-full h-48 rounded-xl overflow-hidden mb-6 relative">
              <img src="/images/ai-bridge.png" alt="The Bridge" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ filter: "brightness(0.9)" }} />
              <div className="absolute inset-0 bg-[#D4AF37]/20 mix-blend-overlay" />
            </div>
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-6 border border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <Sparkles className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h3 className="font-serif text-2xl text-[#D4AF37] mb-4">The AI Bridge</h3>
            <p className="text-[#F8F2E9]/80 leading-relaxed text-sm">
              Through cutting-edge AI, we digitize heritage fashion. We translate physical artistry into immersive digital experiences, virtual try-ons, and hyper-personalized aura matches.
            </p>
          </div>

          {/* Card 3: The Users */}
          <div className="group relative rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 flex flex-col items-center text-center p-8 transition-transform duration-500 hover:-translate-y-2">
            <div className="w-full h-48 rounded-xl overflow-hidden mb-6">
              <img src="/images/jaipur-shop-women.jpg" alt="Users" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ filter: "brightness(0.85)" }} />
            </div>
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-6 border border-[#D4AF37]/30">
              <HeartHandshake className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <h3 className="font-serif text-2xl text-[#F8F2E9] mb-4">The Users</h3>
            <p className="text-[#F8F2E9]/60 leading-relaxed text-sm">
              You don't just wear an outfit; you inherit a story. Discover perfectly fitted, ethically sourced heritage fashion that aligns seamlessly with your unique style identity.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 font-semibold transition-all hover:scale-[1.03] rounded-full"
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
