import { IMG } from "@/constants/cloudinary-images";

const quotes = [
  {
    quote: "Aivestire has given my family's generations of block printing a voice on the global stage.",
    author: "Ravi Sharma",
    role: "Master Block Printer",
    image: IMG.avatarArtisan1,
  },
  {
    quote: "Seeing my woven fabrics styled virtually gives me immense pride in my craft.",
    author: "Anita Devi",
    role: "Handloom Weaver",
    image: IMG.avatarArtisan2,
  },
  {
    quote: "This isn't just commerce; it's the preservation of Jaipur's soul.",
    author: "Vikram Singh",
    role: "Zari Embroiderer",
    image: IMG.avatarArtisan3,
  },
];

export const ArtisanTestimonials = () => {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#0c0907] py-16 sm:py-20 lg:py-24">
      <div
        data-gsap="ambient-orb"
        data-gsap-drift="16"
        className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.03) 48%, transparent 76%)",
          filter: "blur(22px)",
        }}
      />
      <div
        data-gsap="ambient-orb"
        data-gsap-drift="10"
        className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 38%, transparent 74%)",
          filter: "blur(26px)",
        }}
      />
      <div className="container-luxury relative z-10">
        <div data-gsap="section-heading" className="mb-12 text-center sm:mb-16">
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
            <span className="text-[10px] uppercase tracking-[0.48em] font-semibold text-white">Voices of Craft</span>
            <span className="block h-px w-8" style={{ background: "hsl(44 78% 54%)" }} />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#F8F2E9]">
            The Hands Behind the <em className="italic text-white">Heritage</em>
          </h2>
        </div>

        <div data-gsap-group="testimonial-grid" className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3 md:gap-8">
          {quotes.map((q, i) => (
            <article
              data-gsap="testimonial-card"
              data-gsap-hover="lift-card"
              key={i}
              className="relative overflow-hidden rounded-[1.7rem] border border-[#D4AF37]/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.025)_48%,rgba(212,175,55,0.04)_100%)] p-6 transition-all duration-500 hover:bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_48%,rgba(212,175,55,0.08)_100%)] sm:p-8"
            >
              <div
                data-gsap="testimonial-card-glow"
                className="pointer-events-none absolute inset-0 opacity-0"
                style={{
                  background:
                    "radial-gradient(circle at top left, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.05) 34%, transparent 66%)",
                }}
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/55 to-transparent" />

              <div data-gsap="lift-content" className="relative z-10">
                <div data-gsap="testimonial-quote-mark" className="absolute -top-4 -left-2 text-6xl text-white/22 font-serif leading-none group-hover:text-white/40 transition-colors">"</div>
                <p data-gsap="testimonial-copy" className="relative z-10 mb-6 pr-2 text-sm italic leading-relaxed text-white sm:mb-8 sm:text-base">
                  {q.quote}
                </p>
                <div data-gsap="testimonial-meta" className="flex items-center gap-4">
                  <div
                    data-gsap="testimonial-avatar"
                    className="relative h-12 w-12 overflow-hidden rounded-full border border-[#D4AF37]/30 shadow-[0_0_0_1px_rgba(212,175,55,0.08),0_10px_24px_rgba(0,0,0,0.24)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-[#D4AF37]/12" />
                    <img src={q.image} alt={q.author} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{q.author}</div>
                    <div className="text-white text-xs mt-0.5 tracking-[0.16em] uppercase">{q.role}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
