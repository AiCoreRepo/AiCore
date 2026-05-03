import { useRef } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { UpcomingFeaturesSection } from "@/components/UpcomingFeaturesSection";
import { useLandingGsap } from "@/hooks/useLandingGsap";

const UpcomingPage = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  useLandingGsap(pageRef);

  return (
    <div
      ref={pageRef}
      className="min-h-screen overflow-x-hidden bg-[#120d09] text-white"
    >
      <Navbar />

      <main className="relative pt-20 sm:pt-28">
        <UpcomingFeaturesSection />
      </main>

      <Footer />
    </div>
  );
};

export default UpcomingPage;
