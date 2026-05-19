import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Smartphone,
  MapPin,
  ChevronRight,
  ChevronDown,
  User,
  Building2,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  acceptCreatorTerms,
  updateProfile,
  verifyCreatorPayoutUpi,
  saveCreatorAddress
} from "@/lib/api";
import { fetchCreatorOnboardingState } from "@/lib/creatorOnboarding";
import { creatorTermsContent } from "@/content/creatorTerms";

const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

const CreatorOnboardingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [creatorName, setCreatorName] = useState("Creator");

  // Address State
  const [hasAddress, setHasAddress] = useState(false);
  const [addressData, setAddressData] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Payment State
  const [hasPaymentDetails, setHasPaymentDetails] = useState(false);
  const [paymentBeneficiaryName, setPaymentBeneficiaryName] = useState("");
  const [paymentUpiId, setPaymentUpiId] = useState("");
  const [verifiedUpiId, setVerifiedUpiId] = useState("");
  const [verifiedBeneficiaryName, setVerifiedBeneficiaryName] = useState("");
  const [paymentVerificationMessage, setPaymentVerificationMessage] = useState("");
  const [isBeneficiaryAutoFilled, setIsBeneficiaryAutoFilled] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);

  // Terms State
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);
  const [termsCheckboxChecked, setTermsCheckboxChecked] = useState(false);
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  const toggleSection = (index: number) => {
    setExpandedSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // UI State - 3 distinct sections
  const [activeTab, setActiveTab] = useState<"address" | "payout" | "terms">("address");

  useEffect(() => {
    void loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    setIsLoading(true);
    try {
      const state = await fetchCreatorOnboardingState();
      
      setCreatorName(state.profile.name || state.profile.store_name || "Creator");
      
      setHasAddress(state.hasAddress);
      if (state.addressDetails) {
        setAddressData({
          full_name: state.addressDetails.full_name || "",
          phone: state.addressDetails.phone || state.profile.phone || "",
          address_line1: state.addressDetails.address_line1 || "",
          address_line2: state.addressDetails.address_line2 || "",
          city: state.addressDetails.city || "",
          state: state.addressDetails.state || "",
          pincode: state.addressDetails.pincode || ""
        });
      } else if (state.profile.phone) {
         setAddressData(prev => ({ ...prev, phone: state.profile.phone || "" }));
      }

      const existingBeneficiaryName = state.paymentDetails?.beneficiaryName || "";
      const existingUpiId = state.paymentDetails?.upiId || "";
      setHasPaymentDetails(state.hasPaymentDetails);
      setPaymentBeneficiaryName(existingBeneficiaryName);
      setPaymentUpiId(existingUpiId);
      setVerifiedBeneficiaryName(existingBeneficiaryName);
      setVerifiedUpiId(existingUpiId.trim().toLowerCase());
      setIsBeneficiaryAutoFilled(Boolean(existingBeneficiaryName));
      if (existingUpiId) {
        setPaymentVerificationMessage("Existing payout UPI is already saved.");
      }

      setTermsAccepted(state.termsAccepted);
      if (state.termsAccepted) setTermsCheckboxChecked(true);

      if (state.isComplete) {
        navigate("/creator-dashboard", { replace: true });
        return;
      }

      // Auto-navigate to first incomplete step
      if (!state.hasAddress) {
        setActiveTab("address");
      } else if (!state.hasPaymentDetails) {
        setActiveTab("payout");
      } else if (!state.termsAccepted) {
        setActiveTab("terms");
      }

    } catch (error) {
      toast({
        title: "Onboarding Check Failed",
        description: "We could not verify your onboarding status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressData({ ...addressData, [e.target.name]: e.target.value });
    setAddressError("");
  };

  const handleSaveAddress = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!addressData.full_name.trim() || !addressData.phone.trim() || !addressData.address_line1.trim() || 
        !addressData.city.trim() || !addressData.state.trim() || !addressData.pincode.trim()) {
      setAddressError("Please fill all required fields correctly.");
      return;
    }
    setIsSavingAddress(true);
    try {
      await saveCreatorAddress(addressData);
      setHasAddress(true);
      toast({ title: "Address Saved", description: "Your address details have been updated." });
      setActiveTab("payout");
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : "Failed to save address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleVerifyUpi = async () => {
    const upiId = paymentUpiId.trim().toLowerCase();
    if (!upiId) { setPaymentError("Enter a UPI ID to verify."); return; }
    if (!UPI_ID_REGEX.test(upiId)) { setPaymentError("Enter a valid UPI ID like yourname@upi."); return; }
    setPaymentError("");
    setPaymentVerificationMessage("");
    setIsVerifyingUpi(true);
    try {
      const verification = await verifyCreatorPayoutUpi(upiId);
      const returnedBeneficiaryName = verification.payerAccountName?.trim() || "";
      setPaymentUpiId(verification.upiId);
      setVerifiedUpiId(verification.upiId);
      setVerifiedBeneficiaryName(returnedBeneficiaryName);
      if (returnedBeneficiaryName) {
        setPaymentBeneficiaryName(returnedBeneficiaryName);
        setIsBeneficiaryAutoFilled(true);
        setPaymentVerificationMessage(`Verified Account: ${returnedBeneficiaryName}`);
      } else {
        setIsBeneficiaryAutoFilled(false);
        setPaymentVerificationMessage("UPI ID verified. Please enter account holder name manually.");
      }
    } catch (error) {
      setVerifiedUpiId("");
      setVerifiedBeneficiaryName("");
      setIsBeneficiaryAutoFilled(false);
      setPaymentVerificationMessage("");
      setPaymentError(error instanceof Error ? error.message : "Failed to verify UPI.");
    } finally {
      setIsVerifyingUpi(false);
    }
  };

  const handleSavePaymentDetails = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const beneficiaryName = paymentBeneficiaryName.trim();
    const upiId = paymentUpiId.trim().toLowerCase();
    if (!upiId) { setPaymentError("Enter a UPI ID."); return; }
    if (!UPI_ID_REGEX.test(upiId)) { setPaymentError("Enter a valid UPI ID."); return; }
    if (verifiedUpiId !== upiId) { setPaymentError("Verify this UPI ID before continuing."); return; }
    if (!beneficiaryName) { setPaymentError("Confirm beneficiary name."); return; }
    setPaymentError("");
    setIsSavingPayment(true);
    try {
      await updateProfile({ paymentBeneficiaryName: beneficiaryName, paymentUpiId: upiId });
      setHasPaymentDetails(true);
      toast({ title: "Payout Details Saved", description: "Your payout details have been securely saved." });
      setActiveTab("terms");
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Failed to save payout details.");
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleAcceptTerms = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/login", { replace: true }); return; }
    if (!termsCheckboxChecked) return;
    setIsAcceptingTerms(true);
    try {
      await acceptCreatorTerms(token);
      setTermsAccepted(true);
      window.dispatchEvent(new Event("auth-refresh"));
      toast({ title: "Terms Accepted", description: "Onboarding complete! Welcome." });
      navigate("/creator-dashboard", { replace: true });
    } catch (error) {
      toast({ title: "Failed", description: error instanceof Error ? error.message : "Failed to accept terms.", variant: "destructive" });
    } finally {
      setIsAcceptingTerms(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  const inputClass = "custom-dark-input !bg-[#1A1614] !text-white border border-[#D4AF37]/20 placeholder:text-white/30 h-12 rounded-xl focus:!border-[#D4AF37] focus:!ring-1 focus:!ring-[#D4AF37] transition-all w-full text-[15px]";
  const labelClass = "text-[#E6D3A6]/90 font-medium text-sm mb-2 block";

  const allProfileDone = hasAddress && hasPaymentDetails;

  // Calculate overall progress based on the 3 sections
  let progressPoints = 0;
  if (hasAddress) progressPoints += 33.3;
  if (hasPaymentDetails) progressPoints += 33.3;
  if (termsAccepted) progressPoints += 33.4;

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white selection:bg-[#D4AF37]/30 flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar for Navigation & Context */}
      <div className="md:w-[320px] lg:w-[400px] shrink-0 bg-[#120F0D] border-r border-[#D4AF37]/10 flex flex-col relative z-10">
        <div className="p-8 md:p-10 flex-1 overflow-y-auto hide-scrollbar">
          <div className="mb-12">
            <h1 className="text-2xl md:text-3xl font-serif text-[#F6E7C0] mb-3 leading-tight">
              Welcome to<br/>AIVESTIRE,<br/>{creatorName}
            </h1>
            <p className="text-[#E6D3A6]/60 text-sm leading-relaxed">
              Complete your profile to unlock your creator dashboard and start selling your exclusive designs.
            </p>
          </div>

          <nav className="space-y-4">
            {/* 1. Address Tab */}
            <button 
              onClick={() => setActiveTab("address")}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left ${activeTab === "address" ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.05)]' : 'hover:bg-white/[0.02] border border-transparent'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeTab === "address" ? 'bg-[#D4AF37] text-black' : hasAddress ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1A1614] text-[#E6D3A6]/40'}`}>
                {hasAddress ? <CheckCircle2 size={20} /> : <MapPin size={20} />}
              </div>
              <div>
                <h3 className={`font-medium mb-1 ${activeTab === "address" ? 'text-[#F6E7C0]' : 'text-[#E6D3A6]/70'}`}>Store Address</h3>
                <p className="text-xs text-[#E6D3A6]/40 leading-snug">Your business location and contact info.</p>
              </div>
            </button>

            {/* 2. Payout Tab */}
            <button 
              onClick={() => hasAddress && setActiveTab("payout")}
              disabled={!hasAddress && !hasPaymentDetails}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left ${!hasAddress && !hasPaymentDetails ? 'opacity-50 cursor-not-allowed' : ''} ${activeTab === "payout" ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.05)]' : 'hover:bg-white/[0.02] border border-transparent'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeTab === "payout" ? 'bg-[#D4AF37] text-black' : hasPaymentDetails ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1A1614] text-[#E6D3A6]/40'}`}>
                {hasPaymentDetails ? <CheckCircle2 size={20} /> : <Banknote size={20} />}
              </div>
              <div>
                <h3 className={`font-medium mb-1 ${activeTab === "payout" ? 'text-[#F6E7C0]' : 'text-[#E6D3A6]/70'}`}>Payout Details</h3>
                <p className="text-xs text-[#E6D3A6]/40 leading-snug">Bank details to receive your earnings.</p>
              </div>
            </button>

            {/* 3. Terms Tab */}
            <button 
              onClick={() => hasAddress && hasPaymentDetails && setActiveTab("terms")}
              disabled={!(hasAddress && hasPaymentDetails)}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left ${!(hasAddress && hasPaymentDetails) ? 'opacity-50 cursor-not-allowed' : ''} ${activeTab === "terms" ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.05)]' : 'hover:bg-white/[0.02] border border-transparent'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeTab === "terms" ? 'bg-[#D4AF37] text-black' : termsAccepted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1A1614] text-[#E6D3A6]/40'}`}>
                {termsAccepted ? <CheckCircle2 size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <h3 className={`font-medium mb-1 ${activeTab === "terms" ? 'text-[#F6E7C0]' : 'text-[#E6D3A6]/70'}`}>Partner Terms</h3>
                <p className="text-xs text-[#E6D3A6]/40 leading-snug">Review and accept our collaboration guidelines.</p>
              </div>
            </button>
          </nav>
        </div>
        
        {/* Progress Footer */}
        <div className="p-6 border-t border-[#D4AF37]/10 bg-[#120F0D]">
          <div className="flex justify-between text-xs text-[#E6D3A6]/60 mb-3 font-medium tracking-wide">
            <span>ONBOARDING PROGRESS</span>
            <span>{Math.round(progressPoints)}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#1A1614] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F6E7C0] transition-all duration-700 ease-out" style={{ width: `${progressPoints}%` }} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar bg-[#0C0A09] relative">
        {/* Background gradient effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-3xl mx-auto p-6 md:p-12 lg:p-16 relative z-10 min-h-full flex flex-col">
          
          {/* Section 1: Address */}
          {activeTab === "address" && (
            <div className="animate-fadeIn space-y-8 pb-20">
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl md:text-3xl font-serif text-[#F6E7C0]">Store Address</h2>
                <p className="text-[#E6D3A6]/60">Where your business operates from. This ensures accurate pickups.</p>
              </div>

              <div className="bg-[#120F0D]/80 backdrop-blur-sm border border-[#D4AF37]/10 rounded-3xl p-6 md:p-8">
                <form onSubmit={handleSaveAddress} className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label className={labelClass}>Full Name</Label>
                      <Input name="full_name" value={addressData.full_name} onChange={handleAddressChange} className={inputClass} placeholder="Your legal name" required />
                    </div>
                    <div>
                      <Label className={labelClass}>Phone Number</Label>
                      <Input name="phone" type="tel" value={addressData.phone} onChange={handleAddressChange} className={inputClass} placeholder="+91 9876543210" required />
                    </div>
                    <div className="md:col-span-2">
                      <Label className={labelClass}>Address Line 1</Label>
                      <Input name="address_line1" value={addressData.address_line1} onChange={handleAddressChange} className={inputClass} placeholder="Street, Sector, Building" required />
                    </div>
                    <div className="md:col-span-2">
                      <Label className={labelClass}>Address Line 2 (Optional)</Label>
                      <Input name="address_line2" value={addressData.address_line2} onChange={handleAddressChange} className={inputClass} placeholder="Locality, Landmark" />
                    </div>
                    <div>
                      <Label className={labelClass}>City</Label>
                      <Input name="city" value={addressData.city} onChange={handleAddressChange} className={inputClass} placeholder="E.g. Mumbai" required />
                    </div>
                    <div>
                      <Label className={labelClass}>State</Label>
                      <Input name="state" value={addressData.state} onChange={handleAddressChange} className={inputClass} placeholder="E.g. Maharashtra" required />
                    </div>
                    <div className="md:col-span-2">
                      <Label className={labelClass}>Pincode</Label>
                      <Input name="pincode" type="text" value={addressData.pincode} onChange={handleAddressChange} className={inputClass} placeholder="6-digit pincode" maxLength={6} required />
                    </div>
                  </div>
                  
                  {addressError && <p className="text-sm text-red-400">{addressError}</p>}
                  
                  <div className="pt-6 flex justify-end">
                    <Button type="submit" disabled={isSavingAddress} className={`h-12 px-10 rounded-xl font-bold transition-all ${hasAddress ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' : 'bg-gradient-to-r from-[#E7C45B] to-[#D4AF37] text-black hover:opacity-90 shadow-lg shadow-[#D4AF37]/20'}`}>
                      {isSavingAddress ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : hasAddress ? <><CheckCircle2 className="h-5 w-5 mr-2"/>Saved & Continue</> : "Save & Continue"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Section 2: Payout */}
          {activeTab === "payout" && (
            <div className="animate-fadeIn space-y-8 pb-20">
              <div className="space-y-2 mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif text-[#F6E7C0]">Payout Details</h2>
                  <p className="text-[#E6D3A6]/60">Securely receive your earnings via UPI.</p>
                </div>
                <Button variant="ghost" onClick={() => setActiveTab("address")} className="text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 -mb-2">
                  &larr; Back
                </Button>
              </div>

              <div className="bg-[#120F0D]/80 backdrop-blur-sm border border-[#D4AF37]/10 rounded-3xl p-6 md:p-8">
                <form onSubmit={handleSavePaymentDetails} className="space-y-6">
                  <div className="space-y-5">
                    <div>
                      <Label className={labelClass}>UPI ID</Label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input value={paymentUpiId} onChange={(e) => { setPaymentUpiId(e.target.value); setPaymentError(""); if (e.target.value.trim().toLowerCase() !== verifiedUpiId) { setVerifiedUpiId(""); setVerifiedBeneficiaryName(""); } }} placeholder="e.g. yourname@upi" className={`${inputClass} flex-1`} required />
                        <Button type="button" onClick={handleVerifyUpi} disabled={isVerifyingUpi || !paymentUpiId.trim() || paymentUpiId.trim().toLowerCase() === verifiedUpiId} className={`h-12 px-6 rounded-xl font-medium border transition-all ${paymentUpiId.trim().toLowerCase() === verifiedUpiId && verifiedUpiId ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-[#1A1614] text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/10"}`}>
                          {isVerifyingUpi ? <Loader2 className="h-4 w-4 animate-spin" /> : paymentUpiId.trim().toLowerCase() === verifiedUpiId && verifiedUpiId ? "Verified" : "Verify ID"}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className={labelClass}>Account Holder Name</Label>
                      <Input value={paymentBeneficiaryName} onChange={(e) => { setPaymentBeneficiaryName(e.target.value); setIsBeneficiaryAutoFilled(false); setPaymentError(""); }} placeholder="Full name as per bank" className={inputClass} readOnly={isBeneficiaryAutoFilled} required />
                      {isBeneficiaryAutoFilled && <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5"><CheckCircle2 size={12}/> Verified from bank records</p>}
                    </div>
                  </div>
                  
                  <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4 flex items-start gap-3">
                    <ShieldCheck size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200/70 leading-relaxed">Securely processed via PayU. We never ask for your UPI PIN. Account name must match your KYC.</p>
                  </div>
                  
                  {paymentVerificationMessage && <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16} />{paymentVerificationMessage}</p>}
                  {paymentError && <p className="text-sm text-red-400">{paymentError}</p>}
                  
                  <div className="pt-6 flex justify-end">
                    <Button type="submit" disabled={isSavingPayment || !verifiedUpiId} className={`h-12 px-10 rounded-xl font-bold transition-all ${hasPaymentDetails ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' : 'bg-gradient-to-r from-[#E7C45B] to-[#D4AF37] text-black hover:opacity-90 shadow-lg shadow-[#D4AF37]/20'}`}>
                      {isSavingPayment ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : hasPaymentDetails ? <><CheckCircle2 className="h-5 w-5 mr-2"/>Saved & Continue</> : "Save & Continue"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Section 3: Terms */}
          {activeTab === "terms" && (
            <div className="animate-fadeIn flex flex-col h-full max-h-full pb-10">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif text-[#F6E7C0] mb-2">{creatorTermsContent.title}</h2>
                  <p className="text-[#E6D3A6]/60 text-sm">Please review and agree to our partnership guidelines.</p>
                </div>
                <Button variant="ghost" onClick={() => setActiveTab("payout")} className="text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 -mb-2">
                  &larr; Back
                </Button>
              </div>
              
              <div className="flex-1 bg-[#120F0D] border border-[#D4AF37]/20 rounded-3xl overflow-hidden flex flex-col mb-8 shadow-2xl relative">
                <div className="p-4 md:p-6 bg-[#16120E] border-b border-[#D4AF37]/10 flex items-center justify-between shrink-0">
                  <div className="font-serif text-[#D4AF37] text-xl tracking-wider">AIVESTIRE</div>
                  <div className="text-xs text-[#E6D3A6]/40 uppercase tracking-widest">Confidential</div>
                </div>
                
                <div className="p-6 md:p-10 overflow-y-auto hide-scrollbar space-y-10 custom-scroll">
                  <div className="max-w-3xl mx-auto space-y-4">
                    <div className="flex justify-end mb-2">
                      <Button variant="ghost" onClick={() => setExpandedSections(expandedSections.length === creatorTermsContent.sections.length ? [] : creatorTermsContent.sections.map((_, i) => i))} className="text-[#D4AF37] hover:text-[#F6E7C0] hover:bg-[#D4AF37]/10 h-8 px-3 text-xs">
                        {expandedSections.length === creatorTermsContent.sections.length ? "Collapse All" : "Expand All"}
                      </Button>
                    </div>
                    {creatorTermsContent.sections.map((section, idx) => {
                      const isExpanded = expandedSections.includes(idx);
                      return (
                        <div key={idx} className="border border-[#D4AF37]/10 rounded-2xl bg-[#1A1614]/40 overflow-hidden transition-all duration-300">
                          <button 
                            onClick={() => toggleSection(idx)}
                            className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-[#D4AF37]/5 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-sans shrink-0 transition-colors ${isExpanded ? "bg-[#D4AF37] text-black" : "bg-[#D4AF37]/10 text-[#D4AF37]"}`}>
                                {idx + 1}
                              </span>
                              <h3 className={`text-base md:text-lg font-serif pr-4 transition-colors ${isExpanded ? "text-[#F6E7C0]" : "text-[#E6D3A6]/80"}`}>{section.title}</h3>
                            </div>
                            <ChevronDown size={20} className={`text-[#D4AF37] transition-transform duration-300 shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
                            <div className="p-4 md:p-5 pt-0 pl-[68px] space-y-3 pb-6">
                              {section.items.map((item, i) => (
                                <p key={i} className="text-[#E6D3A6]/80 text-[14px] md:text-[15px] leading-relaxed relative before:content-['•'] before:absolute before:-left-5 before:text-[#D4AF37]/50">
                                  {item}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="shrink-0 space-y-6">
                <div 
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${termsCheckboxChecked ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40' : 'bg-[#120F0D] border-[#D4AF37]/10 hover:border-[#D4AF37]/30'}`}
                  onClick={() => setTermsCheckboxChecked(!termsCheckboxChecked)}
                >
                  <div className={`mt-0.5 w-6 h-6 rounded-md flex-shrink-0 border flex items-center justify-center transition-all ${termsCheckboxChecked ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'border-[#E6D3A6]/30'}`}>
                    {termsCheckboxChecked && <CheckCircle2 size={16} strokeWidth={3} />}
                  </div>
                  <div>
                    <Label className="text-[15px] text-[#F6E7C0] cursor-pointer leading-snug font-medium block mb-1">
                      I accept the Creator & Partner Terms
                    </Label>
                    <p className="text-xs text-[#E6D3A6]/50">
                      By checking this box, you digitally sign the agreement to adhere to AIVESTIRE's quality, pricing, and operational standards.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-[#D4AF37]/10">
                  <Button 
                    onClick={handleAcceptTerms} 
                    disabled={!termsCheckboxChecked || isAcceptingTerms} 
                    className="bg-gradient-to-r from-[#E7C45B] to-[#D4AF37] text-black hover:opacity-90 h-14 px-10 rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(212,175,55,0.2)] disabled:opacity-40 disabled:shadow-none transition-all w-full sm:w-auto"
                  >
                    {isAcceptingTerms ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Complete Onboarding"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
      
      {/* Autofill CSS Fixes applied globally within this component */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.4); }

        /* Force ALL inputs in this container to maintain our styling even if autofilled */
        .custom-dark-input,
        .custom-dark-input:-webkit-autofill,
        .custom-dark-input:-webkit-autofill:hover, 
        .custom-dark-input:-webkit-autofill:focus, 
        .custom-dark-input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 50px #1A1614 inset !important;
            -webkit-text-fill-color: #ffffff !important;
            background-color: #1A1614 !important;
            color: #ffffff !important;
        }
      `}} />
    </div>
  );
};

export default CreatorOnboardingPage;
