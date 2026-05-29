import { useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ValueCards } from "@/components/ValueCards";
import { ValueFlowSection } from "@/components/ValueFlowSection";
import { ArtisanTestimonials } from "@/components/ArtisanTestimonials";
import { Footer } from "@/components/Footer";
import { useLandingGsap } from "@/hooks/useLandingGsap";

const Index = () => {
    const pageRef = useRef<HTMLDivElement>(null);
    useLandingGsap(pageRef);

    return (
        <div ref={pageRef} className="min-h-screen overflow-x-hidden" style={{ background: "hsl(30 14% 8%)" }}>
            <Navbar />
            <main className="relative">
                <Hero />
                <ValueCards />
                <ValueFlowSection />
                <ArtisanTestimonials />
            </main>
            <Footer />
        </div>
    );
};

export default Index;
