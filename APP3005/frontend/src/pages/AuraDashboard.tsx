import { useState } from "react";
import { HeroImageSection } from "@/components/aura/HeroImageSection";
import { AuraFormCard } from "@/components/aura/AuraFormCard";
import { ProcessingModal } from "@/components/aura/ProcessingModal";
import { AuraSuccessState } from "@/components/aura/AuraSuccessState";
import { useAuraJobPolling } from "@/hooks/useAuraJobPolling";

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
  const [isSuccess, setIsSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [jobId, setJobId] = useState<string | null>(null);

  // Use real job polling hook
  const { jobStatus, isPolling } = useAuraJobPolling(jobId, !!jobId);

  // Calculate progress and estimated time from job status
  const progress = jobStatus?.progress || 0;
  const estimatedTime = Math.max(0, Math.ceil((100 - progress) / 5)); // Rough estimate

  const handleCreateAura = async (photoFile: File, attributes: BodyAttributes) => {
    // Get auth token first
    const token = localStorage.getItem('access_token');

    // Check if user is authenticated
    if (!token) {
      alert('Please log in to create your Aura');
      window.location.href = '/user-login';
      return;
    }

    setIsProcessing(true);
    setJobId(null); // Reset job ID

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

      // Call API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/aura`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle specific error cases
        if (response.status === 401) {
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('access_token');
          window.location.href = '/user-login';
          return;
        }

        throw new Error(error.message || 'Failed to create Aura');
      }

      const data = await response.json();
      console.log('📦 Full API response:', data);
      console.log('🔑 job_id from response:', data.job_id);

      // Start polling with the job_id from response
      if (data.job_id) {
        console.log('✅ Aura creation started, job_id:', data.job_id);
        setJobId(data.job_id);
      } else {
        console.error('❌ No job_id in response! Cannot start polling.');
        console.error('Response data:', JSON.stringify(data, null, 2));
      }

      // Note: isProcessing will be managed by polling status below

    } catch (error) {
      console.error('Error creating Aura:', error);
      setIsProcessing(false);
      setJobId(null);
      alert(error instanceof Error ? error.message : 'Failed to create Aura. Please try again.');
    }
  };

  // Handle job completion
  if (jobStatus?.status === 'completed' && isProcessing) {
    console.log('✅ Avatar generation completed!');

    // Notify Navbar to refresh Aura status
    window.dispatchEvent(new Event('aura-updated'));

    // Redirect to profile page
    setTimeout(() => {
      setIsProcessing(false);
      setJobId(null);
      window.location.href = '/aura-profile';
    }, 1000);
  }

  // Handle job failure
  if (jobStatus?.status === 'failed' && isProcessing) {
    console.error('❌ Avatar generation failed:', jobStatus.error);
    setIsProcessing(false);
    setJobId(null);
    alert('Avatar generation failed. Please try again.');
  }

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
