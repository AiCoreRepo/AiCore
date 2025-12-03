import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Collection } from "@/components/Collection";
import { AITryOn } from "@/components/AITryOn";
import { LetAIDecide } from "@/components/LetAIDecide";
import { CreatorsCTA } from "@/components/CreatorsCTA";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";

const Index = () => {
    return (
        <div
            className="min-h-screen overflow-x-hidden"
            style={{
                background: 'linear-gradient(180deg, rgba(232, 220, 200, 0.5) 0%, rgba(242, 234, 216, 0.7) 50%, rgba(232, 220, 200, 0.5) 100%)',
            }}
        >
            <Navbar />
            <main>
                <Hero />
                <Features />
                <Collection />
                <AITryOn />
                <LetAIDecide />
                <CreatorsCTA />
                <Testimonials />
            </main>
            <Footer />
        </div>
    );
};

export default Index;
