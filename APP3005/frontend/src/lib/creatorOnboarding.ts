import { getCreatorTermsStatus, getProfile, getCreatorAddress } from "./api";
import type { CreatorAddressData } from "./api";

export interface CreatorPaymentDetails {
  gateway?: string;
  method?: string;
  beneficiaryName?: string;
  upiId?: string;
  verifiedAt?: string;
  updatedAt?: string;
}

export interface CreatorProfileResponse {
  email?: string;
  name?: string;
  store_name?: string;
  avatar?: string;
  subtitle?: string;
  role?: string;
  phone?: string;
  dob?: string;
  paymentDetails?: CreatorPaymentDetails | null;
}

export interface CreatorOnboardingState {
  profile: CreatorProfileResponse;
  termsAccepted: boolean;
  paymentDetails: CreatorPaymentDetails | null;
  hasPaymentDetails: boolean;
  addressDetails: CreatorAddressData | null;
  hasAddress: boolean;
  isComplete: boolean;
}

export async function fetchCreatorOnboardingState(): Promise<CreatorOnboardingState> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("No access token found");
  }

  const [profileResponse, termsStatus, addressDetails] = await Promise.all([
    getProfile(),
    getCreatorTermsStatus(token),
    getCreatorAddress().catch(() => null), // graceful fallback
  ]);

  const profile = profileResponse as CreatorProfileResponse;
  const paymentDetails = profile.paymentDetails ?? null;
  const hasPaymentDetails = Boolean(
    paymentDetails?.beneficiaryName?.trim() && paymentDetails?.upiId?.trim(),
  );
  const termsAccepted = Boolean(termsStatus.accepted);
  const hasAddress = Boolean(
    addressDetails?.city?.trim() && addressDetails?.pincode?.trim(),
  );

  return {
    profile,
    termsAccepted,
    paymentDetails,
    hasPaymentDetails,
    addressDetails,
    hasAddress,
    isComplete: hasAddress && hasPaymentDetails && termsAccepted,
  };
}

export type { CreatorAddressData };
