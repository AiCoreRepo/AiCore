import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ValueCards } from "@/components/ValueCards";
import { StoryDetailSections } from "@/components/StoryDetailSections";
import { ValueFlowSection } from "@/components/ValueFlowSection";
import { ArtisanTestimonials } from "@/components/ArtisanTestimonials";
import { Footer } from "@/components/Footer";

const Index = () => {
    return (
        <div className="min-h-screen overflow-x-hidden" style={{ background: "hsl(30 14% 8%)" }}>
            <Navbar />
            <main className="relative">
                <Hero />
                <ValueCards />
                <StoryDetailSections />
                <ValueFlowSection />
                <ArtisanTestimonials />
            </main>
            <Footer />
        </div>
    );
};

export default Index;
