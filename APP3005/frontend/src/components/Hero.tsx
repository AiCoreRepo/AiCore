import heroBg from "@/assets/hero_bg.jpeg";

export const Hero = () => {
    return (
        <section className="w-full bg-[#F8F4EC]">
            {/* Full Width Image - Natural Height to prevent Cropping */}
            <div className="w-full">
                <img
                    src={heroBg}
                    alt="Premium Fashion Collection"
                    className="w-full h-auto object-cover block"
                    fetchPriority="high" // Prioritize loading this LCP image
                    loading="eager"      // Load immediately, not lazily
                    decoding="async"
                />
            </div>
        </section>
    );
};
