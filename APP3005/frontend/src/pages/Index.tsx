import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Collection } from "@/components/Collection";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

const Index = () => {
    return (
        <div className="min-h-screen overflow-x-hidden bg-[#F8F4EC]">
            <Navbar />
            {/* Removed padding-top so Hero sits behind Navbar for immersive look */}
            <main className="relative">
                <Hero />
                <Collection />
                <HowItWorks />
            </main>
            <Footer />
        </div>
    );
};

export default Index;
