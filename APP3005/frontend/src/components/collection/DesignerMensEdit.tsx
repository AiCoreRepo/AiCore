import { ExternalLink } from "lucide-react";

const DESIGNER_MENS_PICKS = [
  {
    title: "Ivory Brocade Sherwani",
    detail: "Embroidered collar",
    image: "https://imagescdn.tasva.com/img/app/product/1/1078522-16670745.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/products/ivory-brocade-sherwani-with-embroidered-collar-am6tmsy0044ivy",
  },
  {
    title: "Blue Printed Kurta Set",
    detail: "Screen-printed festive set",
    image: "https://imagescdn.tasva.com/img/app/product/1/1077659-16666599.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/products/blue-screen-printed-kurta-set-tmkjba1157med-blue",
  },
  {
    title: "Multi-coloured Kurta Set",
    detail: "Zipper-detail cotton set",
    image: "https://imagescdn.tasva.com/img/app/product/1/1077767-16667346.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/products/multi-colored-printed-kurta-set-with-zipper-detailing-tmkjma1823multi?variant=47727227470057",
  },
  {
    title: "White Embroidered Kurta Set",
    detail: "Tonal thread embroidery",
    image: "https://imagescdn.tasva.com/img/app/product/1/1077579-16666216.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/p/white-kurta-set-1077579.html",
  },
  {
    title: "Light Blue Kurta Set",
    detail: "Refined embroidered set",
    image: "https://imagescdn.tasva.com/img/app/product/1/1077578-16666211.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/p/light-blue-kurta-set-1077578.html",
  },
  {
    title: "Ivory Pintuck Kurta Set",
    detail: "Wedding-ready classic",
    image: "https://imagescdn.tasva.com/img/app/product/1/1154954-21806222.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/p/ivory-kurta-set-1154954.html",
  },
  {
    title: "Dusty Lilac Kurta Set",
    detail: "Textured jacquard set",
    image: "https://imagescdn.tasva.com/img/app/product/1/1225610-31104990.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/p/lilac-embroidered-kurta-set-1225610.html",
  },
  {
    title: "Eclipse Black Kurta Set",
    detail: "Evening sequin finish",
    image: "https://imagescdn.tasva.com/img/app/product/1/1225608-31104971.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/p/black-solid-kurta-set-1225608.html",
  },
  {
    title: "Beige Pintuck Kurta Set",
    detail: "Understated pre-wedding look",
    image: "https://imagescdn.tasva.com/img/app/product/1/1189409-24816883.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/p/beige-kurta-set-1189409.html",
  },
  {
    title: "Navy Cotton Kurta Set",
    detail: "Floral printed set",
    image: "https://imagescdn.tasva.com/img/app/product/1/1139739-20477189.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/p/navy-cotton-print-kurta-set-1139739.html",
  },
  {
    title: "Navy Pintuck Kurta Set",
    detail: "Classic festive tailoring",
    image: "https://imagescdn.tasva.com/img/app/product/1/1154941-21806158.jpg?q=85&auto=format&w=900",
    href: "https://www.tasva.com/p/navy-kurta-set-1154941.html",
  },
] as const;

export function DesignerMensEdit() {
  return (
    <section className="mb-12 border-b border-[#E8DCC4] pb-12">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A7437]">
            Curated from Tasva by Tarun Tahiliani
          </p>
          <h2 className="mt-1 font-serif text-2xl text-[#2C2416] sm:text-3xl">
            The Designer Men&apos;s Edit
          </h2>
        </div>
        <p className="max-w-md text-xs leading-5 text-[#6B5D4F] sm:text-right">
          Designer inspiration sourced from the official store. Availability and
          purchase are handled by the original retailer.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {DESIGNER_MENS_PICKS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="group min-w-0 overflow-hidden rounded-md border border-[#E8DCC4] bg-white transition hover:-translate-y-0.5 hover:border-[#D4AF37] hover:shadow-[0_12px_30px_rgba(44,36,22,0.10)]"
          >
            <div className="aspect-[4/5] overflow-hidden bg-[#F3EFE7]">
              <img
                src={item.image}
                alt={`${item.title} by Tasva`}
                loading="lazy"
                className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <div className="flex min-h-[5.75rem] items-start justify-between gap-2 p-3 sm:p-4">
              <div className="min-w-0">
                <h3 className="text-sm font-medium leading-5 text-[#2C2416] sm:text-base">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-4 text-[#7B6B5C]">{item.detail}</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A7437]">
                  View at Tasva
                </p>
              </div>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7437]" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
