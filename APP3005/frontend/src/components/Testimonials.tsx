import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const pressLogos = [
    {
        name: "VOGUE",
        rating: 5,
        quote: "A comprehensive and reliable resource and new seasonesta.",
        author: "Allan Designer"
    },
    {
        name: "BAZAAR",
        rating: 5,
        quote: "Dank icont on prist and are welling and scalpborator emironest.",
        author: "Aisan Designer"
    },
    {
        name: "designer",
        rating: 5,
        quote: "The most time treasures, our bushgs open assest. Steering customers.",
        author: "Seven Customer"
    },
    {
        name: "Rc",
        rating: 5,
        quote: "A premium experience from start to finish.",
        author: "Lead Stylist"
    },
];

export const Testimonials = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % Math.max(1, pressLogos.length - 2));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + Math.max(1, pressLogos.length - 2)) % Math.max(1, pressLogos.length - 2));
    };

    return (
        <section id="lookbook" className="py-12 md:py-16 bg-ivory-light">
            <div className="container-luxury">
                {/* Press/Testimonial Carousel */}
                <div className="relative">
                    {/* Navigation Arrows */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border border-charcoal/20 hover:border-gold hover:bg-gold/10 transition-colors bg-ivory"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-5 h-5 text-charcoal" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border border-charcoal/20 hover:border-gold hover:bg-gold/10 transition-colors bg-ivory"
                        aria-label="Next"
                    >
                        <ChevronRight className="w-5 h-5 text-charcoal" />
                    </button>

                    {/* Cards Container */}
                    <div className="overflow-hidden mx-10">
                        <div
                            className="flex transition-transform duration-500 gap-4"
                            style={{ transform: `translateX(-${currentIndex * 25}%)` }}
                        >
                            {pressLogos.map((press, index) => (
                                <div
                                    key={index}
                                    className="flex-shrink-0 w-full md:w-[calc(25%-12px)] glass-panel rounded-2xl p-6"
                                >
                                    {/* Logo Name */}
                                    <h3 className="font-serif text-2xl md:text-3xl text-charcoal mb-3 italic">
                                        {press.name}
                                    </h3>

                                    {/* Stars */}
                                    <div className="flex gap-0.5 mb-4">
                                        {[...Array(press.rating)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                                        ))}
                                    </div>

                                    {/* Quote */}
                                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                                        "{press.quote}"
                                    </p>

                                    {/* Author */}
                                    <p className="text-charcoal text-sm font-medium">
                                        — {press.author}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
