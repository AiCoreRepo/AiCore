import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Collection } from "@/components/Collection";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

const Index = () => {
    return (
        <div className="min-h-screen overflow-x-hidden bg-[#F8F4EC]">
            <Navbar />
            {/* Added padding-top so Hero shows below Navbar */}
            <main className="relative pt-20">
                <Hero />
                <Collection />
                <HowItWorks />
            </main>
            <Footer />
        </div>
    );
};

export default Index;
