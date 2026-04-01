import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import TermsModal from "@/components/TermsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  acceptCreatorTerms,
  updateProfile,
  verifyCreatorPayoutUpi,
} from "@/lib/api";
import { fetchCreatorOnboardingState } from "@/lib/creatorOnboarding";

const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

const CreatorOnboardingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasPaymentDetails, setHasPaymentDetails] = useState(false);
  const [creatorName, setCreatorName] = useState("Creator");
  const [paymentBeneficiaryName, setPaymentBeneficiaryName] = useState("");
  const [paymentUpiId, setPaymentUpiId] = useState("");
  const [verifiedUpiId, setVerifiedUpiId] = useState("");
  const [verifiedBeneficiaryName, setVerifiedBeneficiaryName] = useState("");
  const [paymentVerificationMessage, setPaymentVerificationMessage] = useState("");
  const [isBeneficiaryAutoFilled, setIsBeneficiaryAutoFilled] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);

  useEffect(() => {
    void loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    setIsLoading(true);

    try {
      const onboardingState = await fetchCreatorOnboardingState();
      const existingBeneficiaryName =
        onboardingState.paymentDetails?.beneficiaryName || "";
      const existingUpiId = onboardingState.paymentDetails?.upiId || "";

      setCreatorName(
        onboardingState.profile.name ||
          onboardingState.profile.store_name ||
          "Creator",
      );
      setTermsAccepted(onboardingState.termsAccepted);
      setHasPaymentDetails(onboardingState.hasPaymentDetails);
      setPaymentBeneficiaryName(existingBeneficiaryName);
      setPaymentUpiId(existingUpiId);
      setVerifiedBeneficiaryName(existingBeneficiaryName);
      setVerifiedUpiId(existingUpiId.trim().toLowerCase());
      setIsBeneficiaryAutoFilled(Boolean(existingBeneficiaryName));
      setPaymentVerificationMessage(
        existingUpiId ? "Existing payout UPI is already saved." : "",
      );

      if (onboardingState.isComplete) {
        navigate("/creator-dashboard", { replace: true });
        return;
      }

      setIsTermsModalOpen(!onboardingState.termsAccepted);
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

  const handleTermsAccept = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setIsAcceptingTerms(true);

    try {
      await acceptCreatorTerms(token);
      setTermsAccepted(true);
      setIsTermsModalOpen(false);
      toast({
        title: "Terms Accepted",
        description: "Continue with your payout details to finish onboarding.",
      });
    } catch (error) {
      console.error("Failed to accept creator terms:", error);
      toast({
        title: "Terms Acceptance Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save creator terms acceptance.",
        variant: "destructive",
      });
    } finally {
      setIsAcceptingTerms(false);
    }
  };

  const handleTermsDecline = () => {
    localStorage.removeItem("access_token");
    window.dispatchEvent(new Event("auth-refresh"));
    navigate("/login", { replace: true });
  };

  const handleVerifyUpi = async () => {
    const upiId = paymentUpiId.trim().toLowerCase();

    if (!upiId) {
      setPaymentError("Enter a UPI ID to verify.");
      return;
    }

    if (!UPI_ID_REGEX.test(upiId)) {
      setPaymentError("Enter a valid UPI ID like yourname@upi.");
      return;
    }

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
        setPaymentVerificationMessage(
          `Verified with PayU. Account holder name: ${returnedBeneficiaryName}`,
        );
        toast({
          title: "UPI Verified",
          description: `PayU returned the account holder name: ${returnedBeneficiaryName}.`,
        });
      } else {
        if (isBeneficiaryAutoFilled) {
          setPaymentBeneficiaryName("");
        }
        setIsBeneficiaryAutoFilled(false);
        setPaymentVerificationMessage(
          "UPI ID verified, but the bank did not return an account holder name. Enter it manually before saving.",
        );
        toast({
          title: "UPI Verified",
          description:
            "PayU validated the UPI ID, but the account holder name was not returned by the bank.",
        });
      }
    } catch (error) {
      console.error("Failed to verify creator payout UPI ID:", error);
      setVerifiedUpiId("");
      setVerifiedBeneficiaryName("");
      setIsBeneficiaryAutoFilled(false);
      setPaymentVerificationMessage("");
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Failed to verify creator payout UPI ID.",
      );
    } finally {
      setIsVerifyingUpi(false);
    }
  };

  const handleSavePaymentDetails = async () => {
    const beneficiaryName = paymentBeneficiaryName.trim();
    const upiId = paymentUpiId.trim().toLowerCase();

    if (!upiId) {
      setPaymentError("Enter a UPI ID to continue.");
      return;
    }

    if (!UPI_ID_REGEX.test(upiId)) {
      setPaymentError("Enter a valid UPI ID like yourname@upi.");
      return;
    }

    if (verifiedUpiId !== upiId) {
      setPaymentError("Verify this UPI ID with PayU before continuing.");
      return;
    }

    if (!beneficiaryName) {
      setPaymentError("Confirm the beneficiary name before continuing.");
      return;
    }

    setPaymentError("");
    setIsSavingPayment(true);

    try {
      await updateProfile({
        paymentBeneficiaryName: beneficiaryName,
        paymentUpiId: upiId,
      });

      setHasPaymentDetails(true);
      window.dispatchEvent(new Event("auth-refresh"));
      toast({
        title: "Payout Details Saved",
        description: "Your creator onboarding is complete.",
      });
      navigate("/creator-dashboard", { replace: true });
    } catch (error) {
      console.error("Failed to save creator payout details:", error);
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Failed to save creator payout details.",
      );
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div>
      </div>
    );
  }

  const normalizedPaymentUpiId = paymentUpiId.trim().toLowerCase();
  const isCurrentUpiVerified =
    normalizedPaymentUpiId.length > 0 && normalizedPaymentUpiId === verifiedUpiId;

  return (
    <>
      <TermsModal
        isOpen={isTermsModalOpen}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
        isSubmitting={isAcceptingTerms}
      />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,212,118,0.18),_transparent_35%),linear-gradient(135deg,#120f09_0%,#1d1610_45%,#120f09_100%)] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
              Creator Onboarding
            </p>
            <h1 className="mt-4 text-4xl font-serif">
              Finish Your Setup, {creatorName}
            </h1>
            <p className="mt-3 text-sm text-white/70">
              Complete the required onboarding steps before entering the creator dashboard.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div
              className={`rounded-3xl border p-6 ${
                termsAccepted
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-[#D4AF37]/30 bg-white/5"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-2xl p-3 ${
                    termsAccepted
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-[#D4AF37]/15 text-[#F4D03F]"
                  }`}
                >
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Step 1
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">Accept Terms</h2>
                  <p className="mt-2 text-sm text-white/70">
                    Review and accept the creator onboarding terms and conditions.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm">
                <CheckCircle2
                  size={16}
                  className={termsAccepted ? "text-emerald-300" : "text-white/40"}
                />
                <span className={termsAccepted ? "text-emerald-200" : "text-white/60"}>
                  {termsAccepted ? "Completed" : "Pending"}
                </span>
              </div>
            </div>

            <div
              className={`rounded-3xl border p-6 ${
                hasPaymentDetails
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : termsAccepted
                    ? "border-[#D4AF37]/30 bg-white/5"
                    : "border-white/10 bg-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-2xl p-3 ${
                    hasPaymentDetails
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-[#D4AF37]/15 text-[#F4D03F]"
                  }`}
                >
                  <Building2 size={24} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Step 2
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">Add Payout Details</h2>
                  <p className="mt-2 text-sm text-white/70">
                    Verify the payout UPI ID with PayU and save the account holder
                    details that come back.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm">
                <CheckCircle2
                  size={16}
                  className={hasPaymentDetails ? "text-emerald-300" : "text-white/40"}
                />
                <span className={hasPaymentDetails ? "text-emerald-200" : "text-white/60"}>
                  {hasPaymentDetails ? "Completed" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[32px] border border-[#D4AF37]/25 bg-white/5 p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#D4AF37]/15 p-3 text-[#F4D03F]">
                <Smartphone size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-serif">Payout Setup</h2>
                <p className="text-sm text-white/60">
                  Step 2 unlocks after creator terms are accepted.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-2">
                <Label htmlFor="paymentUpiId" className="text-[#F6E7C0]">
                  UPI ID
                </Label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="paymentUpiId"
                    value={paymentUpiId}
                    onChange={(event) => {
                      const nextUpiId = event.target.value;
                      const normalizedNextUpiId = nextUpiId.trim().toLowerCase();

                      setPaymentUpiId(nextUpiId);
                      setPaymentError("");
                      setPaymentVerificationMessage("");

                      if (normalizedNextUpiId !== verifiedUpiId) {
                        setVerifiedUpiId("");
                        setVerifiedBeneficiaryName("");
                        if (isBeneficiaryAutoFilled) {
                          setPaymentBeneficiaryName("");
                        }
                        setIsBeneficiaryAutoFilled(false);
                      }
                    }}
                    disabled={!termsAccepted || isSavingPayment || isVerifyingUpi}
                    placeholder="yourname@upi"
                    className="h-12 flex-1 border-[#E6D3A6]/25 bg-[#22180F] !text-white caret-white placeholder:!text-white/40 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37] focus-visible:ring-offset-[#1A130D]"
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyUpi}
                    disabled={
                      !termsAccepted ||
                      isSavingPayment ||
                      isVerifyingUpi ||
                      paymentUpiId.trim().length === 0
                    }
                    className={`h-12 rounded-xl border px-5 ${
                      isCurrentUpiVerified
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                        : "border-[#D4AF37]/40 bg-[#D4AF37] text-[#1B150C] hover:bg-[#E7C45B]"
                    }`}
                  >
                    {isVerifyingUpi ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : isCurrentUpiVerified ? (
                      "Verified"
                    ) : (
                      "Verify UPI"
                    )}
                  </Button>
                </div>
                <p className="text-xs leading-6 text-white/55">
                  Verify the UPI ID with PayU before you save it for payouts.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentBeneficiaryName" className="text-[#F6E7C0]">
                  Beneficiary Name
                </Label>
                <Input
                  id="paymentBeneficiaryName"
                  value={paymentBeneficiaryName}
                  onChange={(event) => {
                    setPaymentBeneficiaryName(event.target.value);
                    setIsBeneficiaryAutoFilled(false);
                    setPaymentError("");
                  }}
                  disabled={!termsAccepted || isSavingPayment}
                  placeholder="Returned after verification"
                  className="h-12 border-[#E6D3A6]/25 bg-[#22180F] !text-white caret-white placeholder:!text-white/40 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37] focus-visible:ring-offset-[#1A130D]"
                />
                <p className="text-xs leading-6 text-white/55">
                  PayU fills this automatically when the bank returns the account
                  holder name.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/8 p-4 text-sm text-white/75">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 text-[#F4D03F]" />
                <p>
                  Payouts will be settled via <strong>PayU</strong> to this UPI ID.
                  Enter only the receiving UPI ID. Never enter your UPI PIN or OTP
                  here.
                </p>
              </div>
            </div>

            {(paymentVerificationMessage || verifiedBeneficiaryName) && (
              <div
                className={`mt-6 rounded-2xl border p-4 text-sm ${
                  isCurrentUpiVerified
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-white/75"
                }`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className={isCurrentUpiVerified ? "text-emerald-300" : "text-white/50"}
                  />
                  <div className="space-y-1">
                    {paymentVerificationMessage && <p>{paymentVerificationMessage}</p>}
                    {verifiedBeneficiaryName && (
                      <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/80">
                        Verified account holder: {verifiedBeneficiaryName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {paymentError && (
              <p className="mt-4 text-sm font-medium text-red-300">{paymentError}</p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/55">
                Dashboard access is enabled after both onboarding steps are completed.
              </p>
              <Button
                onClick={handleSavePaymentDetails}
                disabled={
                  !termsAccepted ||
                  isSavingPayment ||
                  isVerifyingUpi ||
                  !isCurrentUpiVerified
                }
                className="h-11 rounded-xl bg-[#D4AF37] px-6 text-[#1B150C] hover:bg-[#E7C45B]"
              >
                {isSavingPayment ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatorOnboardingPage;
