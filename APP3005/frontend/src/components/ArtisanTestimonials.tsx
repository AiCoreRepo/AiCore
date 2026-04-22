import { useRef } from "react";

const quotes = [
  {
    quote: "Aivestire has given my family's generations of block printing a voice on the global stage.",
    author: "Ravi Sharma",
    role: "Master Block Printer",
    image: "/images/avatar-artisan-1.png",
  },
  {
    quote: "Seeing my woven fabrics styled virtually gives me immense pride in my craft.",
    author: "Anita Devi",
    role: "Handloom Weaver",
    image: "/images/avatar-artisan-2.png",
  },
  {
    quote: "This isn't just commerce; it's the preservation of Jaipur's soul.",
    author: "Vikram Singh",
    role: "Zari Embroiderer",
    image: "/images/avatar-artisan-3.png",
  },
];

export const ArtisanTestimonials = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-[#0c0907] border-t border-white/5">
      <div className="container-luxury relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
            <span className="text-[10px] uppercase tracking-[0.48em] font-semibold text-[#D4AF37]">Voices of Craft</span>
            <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#F8F2E9]">
            The Hands Behind the <em className="italic text-[#D4AF37]">Heritage</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {quotes.map((q, i) => (
            <div key={i} className="rounded-2xl p-8 bg-white/[0.02] border border-[#D4AF37]/20 relative group transition-all hover:bg-white/[0.04]">
              <div className="absolute -top-4 -left-2 text-6xl text-[#D4AF37]/20 font-serif leading-none group-hover:text-[#D4AF37]/40 transition-colors">"</div>
              <p className="text-[#F8F2E9]/70 italic leading-relaxed mb-8 relative z-10">
                {q.quote}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D4AF37]/30">
                  <img src={q.image} alt={q.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-[#F8F2E9] font-medium text-sm">{q.author}</div>
                  <div className="text-[#D4AF37] text-xs mt-0.5">{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
