import { IMG } from "@/constants/cloudinary-images";

const quotes = [
  {
    quote: "Aivestire has given my family's generations of block printing a voice on the global stage.",
    author: "Ravi Sharma",
    role: "Master block printer",
    image: IMG.avatarArtisan1,
  },
  {
    quote: "Seeing my woven fabrics styled virtually gives me pride in how craft can travel further.",
    author: "Anita Devi",
    role: "Handloom weaver",
    image: IMG.avatarArtisan2,
  },
  {
    quote: "The platform keeps the work personal. Buyers understand the piece before they buy it.",
    author: "Vikram Singh",
    role: "Zari embroiderer",
    image: IMG.avatarArtisan3,
  },
];

export const ArtisanTestimonials = () => {
  return (
    <section className="relative overflow-hidden border-t border-[#211B14]/10 bg-[#F8F4EC] py-16 sm:py-20 lg:py-24">
      <div className="container-luxury">
        <div data-gsap="section-heading" className="mb-10 max-w-3xl sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="h-px w-8 bg-[#A97C32]" />
            <span className="text-xs font-bold uppercase text-[#596D54]">Voices of craft</span>
          </div>
          <h2 className="font-serif text-4xl font-medium leading-tight text-[#211B14] sm:text-5xl">
            The hands behind the heritage.
          </h2>
        </div>

        <div data-gsap-group="testimonial-grid" className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {quotes.map((q) => (
            <article
              data-gsap="testimonial-card"
              key={q.author}
              className="rounded-lg border border-[#211B14]/10 bg-white p-6"
            >
              <p data-gsap="testimonial-copy" className="min-h-28 text-base leading-7 text-[#3A3126]">
                “{q.quote}”
              </p>
              <div data-gsap="testimonial-meta" className="mt-7 flex items-center gap-4">
                <div data-gsap="testimonial-avatar" className="h-12 w-12 overflow-hidden rounded-full bg-[#E7E1D4]">
                  <img src={q.image} alt={q.author} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#211B14]">{q.author}</div>
                  <div className="mt-1 text-xs uppercase text-[#6A5F51]">{q.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
