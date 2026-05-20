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
  ChevronLeft
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
import {
  fetchCreatorOnboardingState,
  type CreatorProfileResponse,
} from "@/lib/creatorOnboarding";
import {
  creatorTermsAcknowledgements,
  creatorTermsContent,
  creatorTermsPdfUrl,
} from "@/content/creatorTerms";
import "@/components/TermsModal.css";

const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

const getNameFromEmail = (email?: string) =>
  email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "";

const getProfileDisplayName = (profile: CreatorProfileResponse) =>
  profile.name?.trim() ||
  profile.store_name?.trim() ||
  getNameFromEmail(profile.email) ||
  "Creator";

const getRegisteredDob = (profile: CreatorProfileResponse) => {
  if (profile.dob) return profile.dob;
  if (!profile.email) return "";
  return localStorage.getItem(`aivestire:dob:${profile.email.toLowerCase()}`) || "";
};

const CreatorOnboardingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Overall state
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [creatorName, setCreatorName] = useState("Creator");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredDob, setRegisteredDob] = useState("");
  
  // Step 1: Address
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

  // Step 2: Payment
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

  // Step 3: Terms
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);
  const [termsChecks, setTermsChecks] = useState<boolean[]>(
    creatorTermsAcknowledgements.map(() => false),
  );
  const [showTermsDocument, setShowTermsDocument] = useState(false);
  const allTermsChecked = termsChecks.every(Boolean);

  useEffect(() => {
    void loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    setIsLoading(true);
    try {
      const onboardingState = await fetchCreatorOnboardingState();
      const profileDisplayName = getProfileDisplayName(onboardingState.profile);
      const profilePhone = onboardingState.profile.phone || "";
      const profileFullName =
        profileDisplayName !== "Creator"
          ? profileDisplayName
          : getNameFromEmail(onboardingState.profile.email);

      setCreatorName(profileDisplayName);
      setRegisteredEmail(onboardingState.profile.email || "");
      setRegisteredDob(getRegisteredDob(onboardingState.profile));
      
      // Load address
      setHasAddress(onboardingState.hasAddress);
      if (onboardingState.addressDetails) {
        setAddressData({
          full_name: onboardingState.addressDetails.full_name || profileFullName,
          phone: onboardingState.addressDetails.phone || profilePhone,
          address_line1: onboardingState.addressDetails.address_line1 || "",
          address_line2: onboardingState.addressDetails.address_line2 || "",
          city: onboardingState.addressDetails.city || "",
          state: onboardingState.addressDetails.state || "",
          pincode: onboardingState.addressDetails.pincode || ""
        });
      } else if (profileFullName || profilePhone) {
        setAddressData(prev => ({
          ...prev,
          full_name: prev.full_name || profileFullName,
          phone: prev.phone || profilePhone,
        }));
      }

      // Load payment
      const existingBeneficiaryName = onboardingState.paymentDetails?.beneficiaryName || "";
      const existingUpiId = onboardingState.paymentDetails?.upiId || "";
      setHasPaymentDetails(onboardingState.hasPaymentDetails);
      setPaymentBeneficiaryName(existingBeneficiaryName);
      setPaymentUpiId(existingUpiId);
      setVerifiedBeneficiaryName(existingBeneficiaryName);
      setVerifiedUpiId(existingUpiId.trim().toLowerCase());
      setIsBeneficiaryAutoFilled(Boolean(existingBeneficiaryName));
      if (existingUpiId) {
        setPaymentVerificationMessage("Existing payout UPI is already saved.");
      }

      // Load terms
      if (onboardingState.termsAccepted) {
        setTermsChecks(creatorTermsAcknowledgements.map(() => true));
      }

      if (onboardingState.isComplete) {
        navigate("/creator-dashboard", { replace: true });
        return;
      }

      // Determine initial step
      if (!onboardingState.hasAddress) setCurrentStep(1);
      else if (!onboardingState.hasPaymentDetails) setCurrentStep(2);
      else if (!onboardingState.termsAccepted) setCurrentStep(3);

    } catch (error) {
      console.error("Failed to load creator onboarding state:", error);
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
      toast({ title: "Address Saved", description: "Proceed to payment details." });
      setCurrentStep(2);
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
      toast({ title: "Payout Details Saved", description: "Proceed to accept terms." });
      setCurrentStep(3);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Failed to save payout details.");
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleAcceptTerms = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/login", { replace: true }); return; }
    if (!allTermsChecked) return;
    setIsAcceptingTerms(true);
    try {
      await acceptCreatorTerms(token);
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
      <div className="min-h-screen bg-[#120f09] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, name: "Address", icon: MapPin },
    { id: 2, name: "Payout", icon: Smartphone },
    { id: 3, name: "Terms", icon: FileText }
  ];

  // OVERRIDING WITH !IMPORTANT TO GUARANTEE VISIBILITY NO MATTER WHAT SHADCN DOES
  const inputClass = "bg-[#16120e] border border-[#D4AF37]/30 !text-white placeholder:!text-white/40 h-12 rounded-xl shadow-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-300 w-full";
  const labelClass = "text-[#E6D3A6] font-medium text-sm block mb-2";

  return (
    <div className="min-h-screen bg-[#120f09] px-4 py-8 flex flex-col items-center overflow-x-hidden">
      <div className="w-full max-w-5xl flex flex-col items-center">
        
        <div className="text-center w-full mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-[#F6E7C0] mb-3">
            Welcome, {creatorName}
          </h1>
          <p className="text-[#E6D3A6]/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            We are honored to welcome you as a partner. To ensure a seamless experience—from accurate pickups to timely, secure payments—we kindly request a few essential details.
          </p>
        </div>

        <div className="flex justify-center items-center gap-3 sm:gap-6 mb-8 w-full">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all ${
                      isActive 
                        ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" 
                        : isCompleted 
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" 
                        : "border-white/10 bg-white/5 text-white/30"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : <step.icon size={16} />}
                  </div>
                  <span className={`text-xs font-medium uppercase tracking-wider hidden sm:block ${
                    isActive ? "text-[#D4AF37]" : isCompleted ? "text-emerald-500" : "text-white/30"
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-px mx-2 sm:mx-3 ${isCompleted ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Outer card wrapper */}
        <div className="w-full rounded-2xl border border-[#D4AF37]/20 bg-[#1d1610] p-6 sm:p-8 shadow-2xl">
          
          {currentStep === 1 && (
            <form onSubmit={handleSaveAddress} className="animate-fadeIn w-full max-w-3xl mx-auto">
              <div className="mb-6 border-b border-[#D4AF37]/10 pb-4">
                <h2 className="text-xl font-serif text-[#F6E7C0]">Business Address</h2>
              </div>
              <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                {(registeredEmail || registeredDob) && (
                  <div className="md:col-span-2 grid gap-x-6 gap-y-4 md:grid-cols-2">
                    {registeredEmail && (
                      <div>
                        <Label className={labelClass}>Registered Email</Label>
                        <Input value={registeredEmail} readOnly className={`${inputClass} bg-[#120f09] !text-[#F6E7C0]`} style={{ color: "white" }} />
                      </div>
                    )}
                    {registeredDob && (
                      <div>
                        <Label className={labelClass}>Date of Birth</Label>
                        <Input value={registeredDob} readOnly className={`${inputClass} bg-[#120f09] !text-[#F6E7C0]`} style={{ color: "white" }} />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <Label className={labelClass}>Full Name *</Label>
                  <Input name="full_name" value={addressData.full_name} onChange={handleAddressChange} className={inputClass} placeholder="Enter your full name" style={{ color: "white" }} required minLength={2} />
                </div>
                <div>
                  <Label className={labelClass}>Contact Phone *</Label>
                  <Input name="phone" type="tel" value={addressData.phone} onChange={handleAddressChange} className={inputClass} placeholder="+91 9876543210" style={{ color: "white" }} required pattern="^\+?[0-9]{10,13}$" title="Enter a valid phone number" />
                </div>
                <div className="md:col-span-2">
                  <Label className={labelClass}>Address Line 1 *</Label>
                  <Input name="address_line1" value={addressData.address_line1} onChange={handleAddressChange} className={inputClass} placeholder="House No, Building, Street Area" style={{ color: "white" }} required />
                </div>
                <div className="md:col-span-2">
                  <Label className={labelClass}>Address Line 2 (Optional)</Label>
                  <Input name="address_line2" value={addressData.address_line2} onChange={handleAddressChange} className={inputClass} placeholder="Locality, Landmark, etc." style={{ color: "white" }} />
                </div>
                <div>
                  <Label className={labelClass}>City *</Label>
                  <Input name="city" value={addressData.city} onChange={handleAddressChange} className={inputClass} placeholder="e.g. Mumbai" style={{ color: "white" }} required />
                </div>
                <div>
                  <Label className={labelClass}>State *</Label>
                  <Input name="state" value={addressData.state} onChange={handleAddressChange} className={inputClass} placeholder="e.g. Maharashtra" style={{ color: "white" }} required />
                </div>
                <div className="md:col-span-2">
                  <Label className={labelClass}>Pincode *</Label>
                  <Input name="pincode" type="text" inputMode="numeric" value={addressData.pincode} onChange={handleAddressChange} className={inputClass} placeholder="6-digit postal code" style={{ color: "white" }} maxLength={6} required pattern="^[0-9]{6}$" title="Enter a valid 6-digit pincode" />
                </div>
              </div>
              {addressError && <p className="mt-4 text-sm text-red-400">{addressError}</p>}
              <div className="mt-8 flex justify-end">
                <Button type="submit" disabled={isSavingAddress} className="bg-[#D4AF37] text-black hover:bg-[#E7C45B] h-11 px-8 rounded-xl font-medium">
                  {isSavingAddress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue"}
                </Button>
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleSavePaymentDetails} className="animate-fadeIn w-full max-w-3xl mx-auto">
              <div className="mb-6 border-b border-[#D4AF37]/10 pb-4">
                <h2 className="text-xl font-serif text-[#F6E7C0]">Payout Details</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <Label className={labelClass}>UPI ID *</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input value={paymentUpiId} onChange={(e) => { setPaymentUpiId(e.target.value); setPaymentError(""); if (e.target.value.trim().toLowerCase() !== verifiedUpiId) { setVerifiedUpiId(""); setVerifiedBeneficiaryName(""); } }} placeholder="e.g. yourname@upi" className={`${inputClass} flex-1`} style={{ color: "white" }} required />
                    <Button type="button" onClick={handleVerifyUpi} disabled={isVerifyingUpi || !paymentUpiId.trim() || paymentUpiId.trim().toLowerCase() === verifiedUpiId} className={`h-12 px-6 rounded-xl font-medium border ${paymentUpiId.trim().toLowerCase() === verifiedUpiId && verifiedUpiId ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" : "bg-[#16120e] text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/10"}`}>
                      {isVerifyingUpi ? <Loader2 className="h-4 w-4 animate-spin" /> : paymentUpiId.trim().toLowerCase() === verifiedUpiId && verifiedUpiId ? "Verified" : "Verify ID"}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className={labelClass}>Account Holder Name *</Label>
                  <Input value={paymentBeneficiaryName} onChange={(e) => { setPaymentBeneficiaryName(e.target.value); setIsBeneficiaryAutoFilled(false); setPaymentError(""); }} placeholder="Enter full name as per bank account" className={inputClass} readOnly={isBeneficiaryAutoFilled} style={{ color: "white" }} required />
                  {isBeneficiaryAutoFilled && <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><CheckCircle2 size={12}/> Auto-verified from bank records</p>}
                </div>
              </div>
              <div className="mt-6 rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 flex items-start gap-3">
                <ShieldCheck size={18} className="text-blue-400 mt-0.5" />
                <p className="text-xs text-blue-200/80 leading-relaxed">Your payments are securely processed via PayU. We never ask for your UPI PIN. Ensure the account name matches your KYC.</p>
              </div>
              {paymentVerificationMessage && <p className="mt-4 text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16} />{paymentVerificationMessage}</p>}
              {paymentError && <p className="mt-4 text-sm text-red-400">{paymentError}</p>}
              <div className="mt-8 flex justify-between">
                <Button type="button" variant="ghost" onClick={() => setCurrentStep(1)} className="text-[#E6D3A6]/70 hover:text-[#E6D3A6] hover:bg-white/5 h-11 px-6 rounded-xl"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button type="submit" disabled={isSavingPayment || !verifiedUpiId} className="bg-[#D4AF37] text-black hover:bg-[#E7C45B] h-11 px-8 rounded-xl font-medium disabled:opacity-50">
                  {isSavingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue"}
                </Button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <div className="animate-fadeIn w-full max-w-5xl mx-auto">
              <div className="mb-6 border-b border-[#D4AF37]/10 pb-4 flex flex-col items-center">
                <h2 className="text-2xl font-serif text-[#F6E7C0] mb-2">{creatorTermsContent.title}</h2>
                <p className="text-sm text-[#E6D3A6]/60">{creatorTermsContent.brand} • {creatorTermsContent.intro}</p>
              </div>
              
              <div className="max-w-3xl mx-auto space-y-3 mb-6">
                {creatorTermsAcknowledgements.map((item, index) => (
                  <label
                    key={item}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all shadow-sm ${termsChecks[index] ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10'}`}
                  >
                    <input
                      type="checkbox"
                      checked={termsChecks[index]}
                      onChange={() =>
                        setTermsChecks((current) =>
                          current.map((checked, itemIndex) =>
                            itemIndex === index ? !checked : checked,
                          ),
                        )
                      }
                      className="mt-1 h-5 w-5 rounded border-[#D4AF37]/50 bg-[#120f09] text-[#D4AF37] accent-[#D4AF37]"
                    />
                    <span className="text-[14px] text-[#F6E7C0] leading-relaxed font-medium">
                      {item}
                    </span>
                  </label>
                ))}
              </div>

              <div className="max-w-3xl mx-auto rounded-2xl border border-[#D4AF37]/20 bg-[#16120e] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTermsDocument((current) => !current)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-[#F6E7C0] hover:bg-white/5 transition-colors"
                >
                  <span className="flex items-center gap-3 font-medium">
                    <FileText size={18} className="text-[#D4AF37]" />
                    Read full terms
                  </span>
                  <span className="text-xs text-[#D4AF37]">
                    {showTermsDocument ? "Hide document" : "Open document"}
                  </span>
                </button>
                {showTermsDocument && (
                  <div className="h-[520px] border-t border-[#D4AF37]/10 bg-black">
                    <iframe
                      title="AIVESTIRE partner terms and conditions"
                      src={`${creatorTermsPdfUrl}#toolbar=1&navpanes=0`}
                      className="h-full w-full"
                    />
                  </div>
                )}
              </div>

              <div className="mt-10 flex justify-between border-t border-[#D4AF37]/10 pt-6 max-w-3xl mx-auto">
                <Button variant="ghost" onClick={() => setCurrentStep(2)} className="text-[#E6D3A6]/70 hover:text-[#E6D3A6] hover:bg-white/5 h-12 px-6 rounded-xl"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={handleAcceptTerms} disabled={!allTermsChecked || isAcceptingTerms} className="bg-gradient-to-r from-[#E7C45B] to-[#D4AF37] text-black hover:opacity-90 h-12 px-10 rounded-xl font-bold shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50 disabled:shadow-none transition-all">
                  {isAcceptingTerms ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CreatorOnboardingPage;
