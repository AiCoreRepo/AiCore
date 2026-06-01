import { Link } from "react-router-dom";
import { ArrowRight, Brush, HeartHandshake, Sparkles } from "lucide-react";
import { IMG } from "@/constants/cloudinary-images";

const flowItems = [
  {
    icon: Brush,
    title: "For artisans",
    body: "A clear digital home for craft, product detail, and creator identity.",
  },
  {
    icon: Sparkles,
    title: "For discovery",
    body: "AI helps each person understand fit, colour, and personal relevance.",
  },
  {
    icon: HeartHandshake,
    title: "For buyers",
    body: "A more confident path from seeing a piece to wearing it.",
  },
];

export const ValueFlowSection = () => {
  return (
    <section
      id="about"
      className="py-16 sm:py-20 lg:py-24"
      style={{ background: "#211B14" }}
    >
      <div className="container-luxury">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div data-gsap="section-heading">
            <div className="mb-4 inline-flex items-center gap-3">
              <span className="h-px w-8 bg-[#C89A45]" />
              <span className="text-xs font-bold uppercase text-[#DCC9AA]">
                The Aivestire ecosystem
              </span>
            </div>

            <h2 className="font-serif text-4xl font-medium leading-tight text-[#FFF8EC] sm:text-5xl">
              A simple bridge between craft and choice.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#E9DCC8]/70 sm:text-lg">
              The platform connects artisan work with the right customer through storytelling, try-on, and personal recommendation.
            </p>

            <div data-gsap-group="ecosystem-grid" className="mt-9 grid gap-5">
              {flowItems.map(({ icon: Icon, title, body }) => (
                <div key={title} data-gsap="ecosystem-card" className="flex gap-4 border-t border-white/12 pt-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6D7BF] text-[#211B14]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-medium text-[#FFF8EC]">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#E9DCC8]/70">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/login"
              data-gsap="cta-pill"
              data-gsap-hover="magnetic-strong"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#E6D7BF] px-6 py-3 text-sm font-semibold text-[#211B14] transition-colors hover:bg-white"
            >
              Join Aivestire
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div data-gsap="split-media-right" className="overflow-hidden rounded-lg">
            <img
              data-gsap="ecosystem-image"
              src={IMG.jaipurShopWomen}
              alt="Customer discovering artisan fashion"
              className="aspect-[4/5] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
