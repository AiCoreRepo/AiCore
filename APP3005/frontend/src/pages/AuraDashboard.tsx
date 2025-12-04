import { useState } from "react";
import { HeroImageSection } from "@/components/aura/HeroImageSection";
import { AuraFormCard } from "@/components/aura/AuraFormCard";
import { ProcessingModal } from "@/components/aura/ProcessingModal";
import { AuraSuccessState } from "@/components/aura/AuraSuccessState";

interface BodyAttributes {
  height?: number;
  weight?: number;
  skinTone?: string;
  gender?: string;
  bodyShape?: string;
  ageRange?: string;
  hairStyle?: string;
}

const AuraDashboard = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(20);
  const [isSuccess, setIsSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const handleCreateAura = async (photoFile: File, attributes: BodyAttributes) => {
    setIsProcessing(true);
    setProgress(0);
    setEstimatedTime(20);

    try {
      // Create FormData with photo and attributes
      const formData = new FormData();
      formData.append('photo', photoFile);

      // Append attributes
      if (attributes.height) formData.append('height', attributes.height.toString());
      if (attributes.weight) formData.append('weight', attributes.weight.toString());
      if (attributes.skinTone) formData.append('skinTone', attributes.skinTone);
      if (attributes.gender) formData.append('gender', attributes.gender);
      if (attributes.bodyShape) formData.append('bodyShape', attributes.bodyShape);
      if (attributes.ageRange) formData.append('ageRange', attributes.ageRange);
      if (attributes.hairStyle) formData.append('hairStyle', attributes.hairStyle);

      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return 90; // Stop at 90% until we get response
          }
          return prev + 10;
        });
        setEstimatedTime((prev) => Math.max(0, prev - 2));
      }, 1000);

      // Get auth token
      const token = localStorage.getItem('access_token');

      // Call API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/aura`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create Aura');
      }

      const data = await response.json();

      // Complete progress
      setProgress(100);
      setEstimatedTime(0);

      // Notify Navbar to refresh Aura status
      window.dispatchEvent(new Event('aura-updated'));

      // Show success state
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        setAvatarUrl(data.image_url);
      }, 500);

    } catch (error) {
      console.error('Error creating Aura:', error);
      setIsProcessing(false);
      setProgress(0);
      alert(error instanceof Error ? error.message : 'Failed to create Aura. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Hero Image Section - Left side on desktop, top on mobile */}
      <HeroImageSection />

      {/* Form Card Section - Right side on desktop, bottom on mobile */}
      {!isSuccess ? (
        <AuraFormCard
          onCreateAura={handleCreateAura}
          isProcessing={isProcessing}
        />
      ) : (
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-ivory px-4 py-12">
          <div className="w-full max-w-xl">
            <AuraSuccessState avatarUrl={avatarUrl} />
          </div>
        </div>
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={isProcessing}
        progress={progress}
        estimatedTime={estimatedTime}
      />
    </div>
  );
};

export default AuraDashboard;
