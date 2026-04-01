import { getCreatorTermsStatus, getProfile } from "./api";

export interface CreatorPaymentDetails {
  gateway?: string;
  method?: string;
  beneficiaryName?: string;
  upiId?: string;
  verifiedAt?: string;
  updatedAt?: string;
}

export interface CreatorProfileResponse {
  name?: string;
  store_name?: string;
  avatar?: string;
  subtitle?: string;
  role?: string;
  paymentDetails?: CreatorPaymentDetails | null;
}

export interface CreatorOnboardingState {
  profile: CreatorProfileResponse;
  termsAccepted: boolean;
  paymentDetails: CreatorPaymentDetails | null;
  hasPaymentDetails: boolean;
  isComplete: boolean;
}

export async function fetchCreatorOnboardingState(): Promise<CreatorOnboardingState> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("No access token found");
  }

  const [profileResponse, termsStatus] = await Promise.all([
    getProfile(),
    getCreatorTermsStatus(token),
  ]);

  const profile = profileResponse as CreatorProfileResponse;
  const paymentDetails = profile.paymentDetails ?? null;
  const hasPaymentDetails = Boolean(
    paymentDetails?.beneficiaryName?.trim() && paymentDetails?.upiId?.trim(),
  );
  const termsAccepted = Boolean(termsStatus.accepted);

  return {
    profile,
    termsAccepted,
    paymentDetails,
    hasPaymentDetails,
    isComplete: termsAccepted && hasPaymentDetails,
  };
}
