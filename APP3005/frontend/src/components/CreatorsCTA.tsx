import { Link } from "react-router-dom";

export const CreatorsCTA = () => {
    return (
        <section id="creators" className="py-8 md:py-12 bg-gradient-to-r from-gold via-gold-light to-gold">
            <div className="container-luxury">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left: Text */}
                    <div className="flex items-center gap-2">
                        <h2 className="font-serif text-xl md:text-2xl text-charcoal">
                            Creators — monetize your designs with AiVestire
                        </h2>
                    </div>

                    {/* Center: CTAs */}
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <button className="px-6 py-2.5 bg-charcoal text-ivory text-sm font-medium rounded-full hover:bg-charcoal-light transition-colors">
                                Join as a Creator
                            </button>
                        </Link>
                        <button className="text-sm text-charcoal font-medium hover:underline">
                            Learn More
                        </button>
                    </div>

                    {/* Right: Stats */}
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className="font-serif text-2xl md:text-3xl text-charcoal font-semibold">200+</p>
                            <p className="text-charcoal/70 text-xs">designers onboard</p>
                        </div>
                        <div className="text-center">
                            <p className="font-serif text-2xl md:text-3xl text-charcoal font-semibold">₹1.2M</p>
                            <p className="text-charcoal/70 text-xs">in sales last quarter</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
