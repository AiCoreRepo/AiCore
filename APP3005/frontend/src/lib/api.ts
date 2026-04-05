import {
  getTryOnHostErrorMessage,
  isSupportedTryOnHost,
} from "@/lib/try-on-environment";
import {
  clearStoredAuthTokens,
  getJwtSubject,
  getStoredAccessToken,
  isProbablyJwt,
  isTokenExpired,
} from "@/lib/auth-token";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
let refreshAccessTokenPromise: Promise<string | null> | null = null;

export interface ApiError extends Error {
  status?: number;
  code?: string;
  tryOnsUsed?: number;
  maxTryOns?: number;
  upgradeRequired?: boolean;
  details?: unknown;
}

export type FeedbackContextType =
  | "AVATAR_CREATION"
  | "AVATAR_RECREATION"
  | "VIRTUAL_TRYON";

export interface FeedbackPayload {
  context_type: FeedbackContextType;
  context_reference_id?: string;
  context_label?: string;
  rating: number;
  comment?: string;
}

function parseApiErrorBody(bodyText: string, defaultMessage: string) {
  try {
    const err = JSON.parse(bodyText);
    const nestedMessage =
      typeof err?.message === "string"
        ? err.message
        : typeof err?.message?.message === "string"
          ? err.message.message
          : Array.isArray(err?.message)
            ? err.message.join(", ")
            : undefined;

    return {
      message: nestedMessage || defaultMessage,
      code:
        typeof err?.code === "string"
          ? err.code
          : typeof err?.errorCode === "string"
            ? err.errorCode
            : typeof err?.message?.code === "string"
              ? err.message.code
              : typeof err?.message?.errorCode === "string"
                ? err.message.errorCode
                : undefined,
      tryOnsUsed:
        typeof err?.tryOnsUsed === "number"
          ? err.tryOnsUsed
          : typeof err?.message?.tryOnsUsed === "number"
            ? err.message.tryOnsUsed
            : undefined,
      maxTryOns:
        typeof err?.maxTryOns === "number"
          ? err.maxTryOns
          : typeof err?.message?.maxTryOns === "number"
            ? err.message.maxTryOns
            : undefined,
      upgradeRequired:
        typeof err?.upgradeRequired === "boolean"
          ? err.upgradeRequired
          : typeof err?.message?.upgradeRequired === "boolean"
            ? err.message.upgradeRequired
            : undefined,
      details: err,
    };
  } catch {
    return {
      message: bodyText || defaultMessage,
    };
  }
}

function isHtmlErrorDocument(bodyText: string): boolean {
  const trimmed = bodyText.trim().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

function getFriendlyHttpErrorMessage(
  res: Response,
  bodyText: string,
  defaultMessage: string,
): string {
  if (!isHtmlErrorDocument(bodyText)) {
    return defaultMessage;
  }

  if (res.status === 504) {
    return "The try-on service timed out before the server finished processing. Please try again.";
  }

  if (res.status === 502 || res.status === 503) {
    return "The try-on service is temporarily unavailable. Please try again shortly.";
  }

  return defaultMessage;
}

function createMissingAccessTokenError(): ApiError {
  const error = new Error("No access token found") as ApiError;
  error.status = 401;
  return error;
}

function persistAccessToken(token: string): string {
  localStorage.setItem("access_token", token);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-refresh"));
  }
  return token;
}

export async function refreshAccessToken(
  tokenOverride?: string,
): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const currentToken =
    tokenOverride?.trim() || localStorage.getItem("access_token")?.trim() || "";
  if (!currentToken || !isProbablyJwt(currentToken)) {
    return null;
  }

  const userId = getJwtSubject(currentToken);
  if (!userId) {
    clearStoredAuthTokens();
    return null;
  }

  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
          credentials: "include",
        });

        if (!res.ok) {
          return null;
        }

        const payload = await res.json();
        const nextToken =
          typeof payload?.access_token === "string"
            ? payload.access_token.trim()
            : "";

        if (!nextToken || !isProbablyJwt(nextToken)) {
          return null;
        }

        return persistAccessToken(nextToken);
      } catch {
        return null;
      } finally {
        refreshAccessTokenPromise = null;
      }
    })();
  }

  return refreshAccessTokenPromise;
}

export async function getValidAccessToken(
  tokenOverride?: string,
): Promise<string | null> {
  const currentToken =
    tokenOverride?.trim() ||
    getStoredAccessToken() ||
    localStorage.getItem("access_token")?.trim() ||
    "";

  if (!currentToken || !isProbablyJwt(currentToken)) {
    return null;
  }

  if (!isTokenExpired(currentToken, 30)) {
    return currentToken;
  }

  return refreshAccessToken(currentToken);
}

async function fetchWithAuthRetry(
  url: string,
  init: RequestInit = {},
  tokenOverride?: string,
): Promise<Response> {
  const currentToken = await getValidAccessToken(tokenOverride);
  if (!currentToken) {
    throw createMissingAccessTokenError();
  }

  const runRequest = async (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(url, {
      ...init,
      headers,
      credentials: init.credentials ?? "include",
    });
  };

  const response = await runRequest(currentToken);
  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshAccessToken(currentToken);
  if (!refreshedToken || refreshedToken === currentToken) {
    return response;
  }

  return runRequest(refreshedToken);
}

// Helper function to handle API errors and trigger logout on 401
function handleApiError(
  res: Response,
  bodyText: string,
  defaultMessage: string,
): never {
  const fallbackMessage = getFriendlyHttpErrorMessage(
    res,
    bodyText,
    defaultMessage,
  );
  const parsedError = parseApiErrorBody(bodyText, fallbackMessage);

  const error = new Error(parsedError.message) as ApiError;
  error.status = res.status;
  error.code = parsedError.code;
  error.tryOnsUsed = parsedError.tryOnsUsed;
  error.maxTryOns = parsedError.maxTryOns;
  error.upgradeRequired = parsedError.upgradeRequired;
  error.details = parsedError.details;

  // If it's a 401 Unauthorized, trigger auth-error event to logout
  if (res.status === 401) {
    console.log("🔒 401 Unauthorized - Triggering auth-error event");
    window.dispatchEvent(new Event("auth-error"));
  }

  throw error;
}

function assertSupportedTryOnHost(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!isSupportedTryOnHost()) {
    throw new Error(getTryOnHostErrorMessage());
  }
}

function createStreamApiError(
  payload: unknown,
  defaultMessage: string,
): ApiError {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const error = new Error(
      typeof data.message === "string" && data.message.trim()
        ? data.message
        : defaultMessage,
    ) as ApiError;

    error.status =
      typeof data.statusCode === "number"
        ? data.statusCode
        : typeof data.status === "number"
          ? data.status
          : undefined;
    error.code =
      typeof data.errorCode === "string"
        ? data.errorCode
        : typeof data.code === "string"
          ? data.code
          : undefined;
    error.details = "details" in data ? data.details : payload;
    return error;
  }

  return new Error(
    typeof payload === "string" && payload.trim() ? payload : defaultMessage,
  ) as ApiError;
}

export interface TryOnPermission {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorTermsStatus {
  accepted: boolean;
  acceptedAt: string | null;
  version: string | null;
}

export interface CreatorUpiVerificationResponse {
  provider: "PAYU";
  isValid: boolean;
  upiId: string;
  payerAccountName: string | null;
  rawMessage?: string;
  verifiedAt: string;
}

export interface ProductGroup {
  group_id: string;
  creator_id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  children_groups: ProductGroup[];
  _count?: {
    products: number;
    children?: number;
  };
}

export async function login(data: { email: string; password: string }) {
  // Hardcode endpoint to avoid any accidental whitespace
  const endpoint = BASE_URL + "/auth/login";
  console.log("Sending request to endpoint:", endpoint);
  // SECURITY: Do not log password or full payload in production
  console.log("Login attempt for email:", data.email);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  console.log("Response status:", res.status);
  // SECURITY: Only log headers in development, not response data with tokens
  if (import.meta.env.DEV) {
    console.log("Response headers:", res.headers);
  }

  if (!res.ok) {
    const bodyText = await res.text();
    let message = "Login failed";
    try {
      const parsed = JSON.parse(bodyText);
      console.error("Error response:", parsed);
      message = parsed.message || message;
    } catch {
      console.error("Error response (text):", bodyText);
      message = bodyText || message;
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }

  const responseData = await res.json();
  // SECURITY: Do not log tokens or sensitive data
  console.log("Login successful");
  return responseData;
}

export async function signup(data: {
  email: string;
  password: string;
  brandName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}) {
  // Always send role: 'creator' for creator signups
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      role: "CREATOR",
      store_name: data.brandName,
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
      ...(data.dateOfBirth ? { dateOfBirth: data.dateOfBirth } : {}),
    }),
    credentials: "include",
  });
  if (!res.ok) {
    const bodyText = await res.text();
    let message = "Signup failed";
    try {
      const err = JSON.parse(bodyText);
      message = err.message || message;
    } catch {
      message = bodyText || message;
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function acceptCreatorTerms(token: string) {
  const res = await fetchWithAuthRetry(
    `${BASE_URL}/creators/accept-terms`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    },
    token,
  );

  if (!res.ok) {
    handleApiError(res, await res.text(), "Failed to accept creator terms");
  }

  return res.json();
}

export async function getCreatorTermsStatus(token: string): Promise<CreatorTermsStatus> {
  const res = await fetchWithAuthRetry(
    `${BASE_URL}/creators/terms-status`,
    {
      headers: {},
    },
    token,
  );

  if (!res.ok) {
    handleApiError(res, await res.text(), "Failed to fetch creator terms status");
  }

  return res.json();
}

// User signup for regular users (buyers)
export async function userSignup(data: {
  email: string;
  password: string;
  name?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      role: "BUYER",
      store_name: data.name,
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
      ...(data.dateOfBirth ? { dateOfBirth: data.dateOfBirth } : {}),
    }),
    credentials: "include",
  });
  if (!res.ok) {
    const bodyText = await res.text();
    let message = "Signup failed";
    try {
      const err = JSON.parse(bodyText);
      message = err.message || message;
    } catch {
      message = bodyText || message;
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// Google OAuth authentication
export async function googleAuth(data: {
  token: string;
  role: "CREATOR" | "BUYER" | "ADMIN";
  store_name?: string;
  phoneNumber?: string;
}) {
  const res = await fetch(`${BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const bodyText = await res.text();
    let message = "Google authentication failed";
    try {
      const err = JSON.parse(bodyText);
      message = err.message || message;
    } catch {
      message = bodyText || message;
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function getDashboardMetrics() {
  const res = await fetchWithAuthRetry(`${BASE_URL}/creator-dashboard/metrics`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let message = "Failed to fetch dashboard metrics";
    try {
      const err = JSON.parse(bodyText);
      message = err.message || message;
    } catch {
      message = bodyText || message;
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function getCreatorProducts(
  page: number = 1,
  limit: number = 10,
  groupId?: string,
) {
  let url = `${BASE_URL}/creator-dashboard/products?page=${page}&limit=${limit}`;
  if (groupId) {
    url += `&groupId=${groupId}`;
  }

  const res = await fetchWithAuthRetry(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let message = "Failed to fetch products";
    try {
      const err = JSON.parse(bodyText);
      message = err.message || message;
    } catch {
      message = bodyText || message;
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function getProductById(id: string) {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let message = "Failed to fetch product";
    try {
      const err = JSON.parse(bodyText);
      message = err.message || message;
    } catch {
      message = bodyText || message;
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function getProfile() {
  // Use /auth/me endpoint which works for all roles (BUYER, CREATOR, ADMIN)
  const res = await fetchWithAuthRetry(`${BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to fetch profile");
  }
  return res.json();
}

export async function updateProfile(data: {
  name?: string;
  subtitle?: string;
  avatar?: string;
  paymentBeneficiaryName?: string;
  paymentUpiId?: string;
}) {
  const res = await fetchWithAuthRetry(`${BASE_URL}/creator-dashboard/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let message = "Failed to update profile";
    try {
      const err = JSON.parse(bodyText);
      message = err.message || message;
    } catch {
      message = bodyText || message;
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function verifyCreatorPayoutUpi(
  upiId: string,
): Promise<CreatorUpiVerificationResponse> {
  const res = await fetchWithAuthRetry(`${BASE_URL}/creator-dashboard/payouts/verify-upi`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ upiId }),
  });

  if (!res.ok) {
    handleApiError(res, await res.text(), "Failed to verify creator payout UPI ID");
  }

  return res.json();
}

export async function createProduct(data: {
  title: string;
  description?: string;
  price_cents: number;
  currency?: string;
  inventory_count?: number;
  images: string[];
  tags?: Array<{ name: string }>;
  group_ids?: string[];
  occasions?: string[];
  body_shapes?: string[];
  skin_tones?: string[];
  sizes?: string[];
  age_ranges?: string[];
  category_id?: string;
  sub_category_id?: string;
}) {
  const res = await fetchWithAuthRetry(`${BASE_URL}/creator-dashboard/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to create product");
    } catch {
      throw new Error(bodyText || "Failed to create product");
    }
  }
  return res.json();
}

export async function updateProduct(
  productId: string,
  data: {
    title?: string;
    description?: string;
    price_cents?: number;
    currency?: string;
    inventory_count?: number;
    images?: string[];
    tags?: Array<{ name: string }>;
    group_ids?: string[];
    status?: string;
    occasions?: string[];
    body_shapes?: string[];
    skin_tones?: string[];
    sizes?: string[];
    age_ranges?: string[];
    category_id?: string;
    sub_category_id?: string;
  }
) {
  const res = await fetchWithAuthRetry(
    `${BASE_URL}/creator-dashboard/products/${productId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to update product");
    } catch {
      throw new Error(bodyText || "Failed to update product");
    }
  }
  return res.json();
}

export async function deleteProduct(productId: string) {
  const res = await fetchWithAuthRetry(
    `${BASE_URL}/creator-dashboard/products/${productId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to delete product");
    } catch {
      throw new Error(bodyText || "Failed to delete product");
    }
  }
  return res.json();
}

// Get user's dashboard stats
export async function getUserDashboardStats() {
  const res = await fetchWithAuthRetry(`${BASE_URL}/user-dashboard/stats`, {
    method: "GET",
    headers: {},
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to fetch dashboard stats");
    } catch {
      throw new Error(bodyText || "Failed to fetch dashboard stats");
    }
  }
  return res.json();
}

// Simple creator login API
export async function creatorLogin(email: string) {
  const endpoint = BASE_URL + "/auth/creator-login";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include",
  });
  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const parsed = JSON.parse(bodyText);
      throw new Error(parsed.message || "Creator login failed");
    } catch {
      throw new Error(bodyText || "Creator login failed");
    }
  }
  return res.json();
}

// Get user's Aura status
export async function getAuraStatus() {
  const token = await getValidAccessToken();
  if (!token) {
    return { hasAura: false, aura: null };
  }

  try {
    const res = await fetchWithAuthRetry(
      `${BASE_URL}/aura/status`,
      {
        method: "GET",
        headers: {},
      },
      token,
    );

    if (!res.ok) {
      return { hasAura: false, aura: null };
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching Aura status:", error);
    return { hasAura: false, aura: null };
  }
}

// Like or unlike a product
export async function likeProduct(productId: string) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to like products");
  }

  const res = await fetch(`${BASE_URL}/products/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id: productId }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to like product");
    } catch {
      throw new Error(bodyText || "Failed to like product");
    }
  }
  return res.json();
}

// Add a comment to a product
export async function addComment(
  productId: string,
  commentText: string,
  images?: string[],
) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to comment");
  }

  const res = await fetch(`${BASE_URL}/products/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      product_id: productId,
      comment_text: commentText,
      images: images || [],
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to add comment");
    } catch {
      throw new Error(bodyText || "Failed to add comment");
    }
  }
  return res.json();
}

// Get product likes count and user's like status
export async function getProductLikes(productId: string) {
  const token = localStorage.getItem("access_token");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/products/${productId}/likes`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to get likes");
    } catch {
      throw new Error(bodyText || "Failed to get likes");
    }
  }
  return res.json();
}

// Get product comments
export async function getProductComments(productId: string) {
  const res = await fetch(`${BASE_URL}/products/${productId}/comments`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to get comments");
    } catch {
      throw new Error(bodyText || "Failed to get comments");
    }
  }
  return res.json();
}

// Delete a comment
export async function deleteComment(commentId: string) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to delete comments");
  }

  const res = await fetch(`${BASE_URL}/products/comment/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to delete comment");
    } catch {
      throw new Error(bodyText || "Failed to delete comment");
    }
  }
  return res.json();
}

// ============================================================================
// AI Try-On API Functions
// ============================================================================

// Get user's Aura data
export async function getAura() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to view your Aura");
  }

  const res = await fetch(`${BASE_URL}/aura`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to fetch Aura");
    } catch {
      throw new Error(bodyText || "Failed to fetch Aura");
    }
  }
  return res.json();
}

export async function selectAuraAvatarForTryOns(avatarId: string) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to update your Aura");
  }

  const res = await fetch(`${BASE_URL}/aura/avatars/${avatarId}/select`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    handleApiError(res, await res.text(), "Failed to select Aura avatar");
  }

  return res.json();
}

type TryOnResultPayload = {
  success: boolean;
  resultImage?: string;
  provider?: string;
  status?: string;
  processingTimeMs?: number;
  metadata?: Record<string, unknown>;
  tryOnId?: string | number;
  timestamp?: string;
  message?: string;
};

type TryOnQueuedResponse = {
  success: boolean;
  status?: string;
  jobId?: string;
  job_id?: string;
  message?: string;
  timestamp?: string;
};

type TryOnJobStatusResponse = {
  success: boolean;
  status: string;
  progress: number;
  result?: TryOnResultPayload;
  error?: string;
};

type TryOnStreamEvent = {
  event: string;
  data: string;
};

type AuraStreamResultPayload = {
  success: boolean;
  auraId?: string;
  avatar?: {
    avatarId?: string;
    url?: string;
    tryOnUrl?: string;
    type?: string;
  };
  aura?: {
    aura_id?: string;
    status?: string;
    model_url?: string;
    tryon_model_url?: string;
  };
};

export type StreamEventHandler = (
  eventName: string,
  payload: unknown,
) => void | Promise<void>;

const TRY_ON_JOB_POLL_INTERVAL_MS = 2000;
const TRY_ON_JOB_TIMEOUT_MS = 10 * 60 * 1000;

function isQueuedTryOnResponse(payload: unknown): payload is TryOnQueuedResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const queuedPayload = payload as TryOnQueuedResponse;
  return Boolean(queuedPayload.jobId || queuedPayload.job_id);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTryOnStreamFrame(frame: string): TryOnStreamEvent | null {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of frame.split("\n")) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  return {
    event: eventName,
    data: dataLines.join("\n"),
  };
}

function consumeTryOnStreamFrames(buffer: string): {
  events: TryOnStreamEvent[];
  rest: string;
} {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const frames = normalized.split("\n\n");
  const rest = frames.pop() ?? "";
  const events = frames
    .map((frame) => parseTryOnStreamFrame(frame))
    .filter((event): event is TryOnStreamEvent => Boolean(event));

  return { events, rest };
}

function parseTryOnStreamPayload(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

async function pollTryOnJobResult(
  jobId: string,
  token: string,
  defaultMessage: string,
): Promise<TryOnResultPayload> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < TRY_ON_JOB_TIMEOUT_MS) {
    const res = await fetch(`${BASE_URL}/v1/tryon/job/${jobId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      handleApiError(res, await res.text(), defaultMessage);
    }

    const payload = (await res.json()) as TryOnJobStatusResponse;

    if (payload.status === "completed") {
      if (payload.result) {
        return payload.result;
      }

      throw new Error(defaultMessage);
    }

    if (payload.status === "failed") {
      throw new Error(payload.error || defaultMessage);
    }

    if (payload.status === "not_found") {
      throw new Error("Try-on job could not be found.");
    }

    await delay(TRY_ON_JOB_POLL_INTERVAL_MS);
  }

  throw new Error(
    "Try-on processing is taking longer than expected. Please try again shortly.",
  );
}

async function resolveQueuedTryOnResponse(
  res: Response,
  token: string,
  defaultMessage: string,
): Promise<TryOnResultPayload> {
  if (!res.ok) {
    handleApiError(res, await res.text(), defaultMessage);
  }

  const payload = (await res.json()) as TryOnResultPayload | TryOnQueuedResponse;

  if (isQueuedTryOnResponse(payload)) {
    const jobId = payload.jobId || payload.job_id;
    if (!jobId) {
      throw new Error("Try-on job did not return a valid job id.");
    }

    return pollTryOnJobResult(jobId, token, defaultMessage);
  }

  return payload;
}

async function resolveStreamedResult<T>(
  res: Response,
  defaultMessage: string,
  onEvent?: StreamEventHandler,
): Promise<T> {
  if (!res.ok) {
    handleApiError(res, await res.text(), defaultMessage);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream")) {
    return (await res.json()) as T;
  }

  if (!res.body) {
    throw new Error("Streaming response body is not available.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: T | null = null;
  let streamError: ApiError | null = null;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parsed = consumeTryOnStreamFrames(buffer);
      buffer = parsed.rest;

      for (const event of parsed.events) {
        const payload = parseTryOnStreamPayload(event.data);
        await onEvent?.(event.event, payload);

        if (event.event === "result") {
          if (payload && typeof payload === "object") {
            finalResult = payload as T;
          }
          continue;
        }

        if (event.event === "error") {
          streamError = createStreamApiError(
            payload ?? event.data,
            defaultMessage,
          );
        }
      }
    }

    buffer += decoder.decode();
    const parsed = consumeTryOnStreamFrames(`${buffer}\n\n`);
    for (const event of parsed.events) {
      const payload = parseTryOnStreamPayload(event.data);
      await onEvent?.(event.event, payload);

      if (event.event === "result") {
        if (payload && typeof payload === "object") {
          finalResult = payload as T;
        }
      } else if (event.event === "error") {
        streamError = createStreamApiError(
          payload ?? event.data,
          defaultMessage,
        );
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (streamError) {
    throw streamError;
  }

  if (finalResult) {
    return finalResult;
  }

  throw new Error(defaultMessage);
}

// Try-on with Gemini AI using streamed SSE response
export async function tryOnWithGemini(data: {
  avatarImage: string;
  clothingImage: string;
  additionalParams?: Record<string, unknown>;
}, options?: { onEvent?: StreamEventHandler }) {
  assertSupportedTryOnHost();

  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to use AI Try-On");
  }

  const res = await fetch(`${BASE_URL}/v1/tryon/gemini/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return resolveStreamedResult<TryOnResultPayload>(
    res,
    "Try-on failed",
    options?.onEvent,
  );
}

export async function createAuraWithStream(
  formData: FormData,
  options?: { onEvent?: StreamEventHandler },
) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to create your Aura");
  }

  const res = await fetch(`${BASE_URL}/aura/stream`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return resolveStreamedResult<AuraStreamResultPayload>(
    res,
    "Failed to create Aura",
    options?.onEvent,
  );
}

export async function recreateAuraWithStream(
  formData: FormData,
  options?: { onEvent?: StreamEventHandler },
) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to recreate your Aura");
  }

  const res = await fetch(`${BASE_URL}/aura/recreate/stream`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return resolveStreamedResult<AuraStreamResultPayload>(
    res,
    "Failed to recreate Aura",
    options?.onEvent,
  );
}

// 3D Try-on with Vertex AI using async queue polling
export async function tryOnWithVertex(data: {
  userId: string;
  clothingItemId: string;
  additionalParams?: Record<string, unknown>;
}) {
  assertSupportedTryOnHost();

  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to use AI Try-On");
  }

  const res = await fetch(`${BASE_URL}/v1/tryon/3d/vertex/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return resolveQueuedTryOnResponse(res, token, "Vertex try-on failed");
}

export async function submitFeedback(payload: FeedbackPayload) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to submit feedback");
  }

  const res = await fetch(`${BASE_URL}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let message = "Failed to submit feedback";
    try {
      const err = JSON.parse(bodyText);
      message = err.message || message;
    } catch {
      message = bodyText || message;
    }
    throw new Error(message);
  }

  return res.json();
}

export async function getAdminFeedback(params?: {
  context?: FeedbackContextType;
  minRating?: number;
  maxRating?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.context) search.set("context", params.context);
  if (params?.minRating !== undefined)
    search.set("minRating", String(params.minRating));
  if (params?.maxRating !== undefined)
    search.set("maxRating", String(params.maxRating));
  if (params?.limit !== undefined) search.set("limit", String(params.limit));

  const res = await fetch(`${BASE_URL}/feedback/admin?${search.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let message = "Failed to load feedback";
    try {
      const err = JSON.parse(bodyText);
      message = err.message || message;
    } catch {
      message = bodyText || message;
    }
    throw new Error(message);
  }

  return res.json();
}

// Generate more angles from existing try-on image
export async function generateMoreAngles(data: {
  userId: string;
  productId: string;
  previousImageUrl: string;
  auraId?: string;
  additionalParams?: Record<string, unknown>;
}) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to generate more angles");
  }

  // Get aura if not provided
  let auraId = data.auraId;
  if (!auraId) {
    try {
      const auraData = await getAura();
      auraId = auraData.aura_id;
    } catch (error) {
      throw new Error(
        "Failed to get Aura data. Please create your Aura first.",
      );
    }
  }

  // Call new NestJS angle generation endpoint
  const res = await fetch(`${BASE_URL}/angles/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      previousImageUrl: data.previousImageUrl,
      productId: data.productId,
      auraId: auraId,
      angle: data.additionalParams?.angle,
      cachedMetadata: data.additionalParams?.cachedMetadata,
    }),
  });

  if (!res.ok) {
    handleApiError(res, await res.text(), "Failed to generate more angles");
  }
  return res.json();
}

// Get user's try-on history
export async function getTryOnHistory() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to view try-on history");
  }

  const res = await fetch(`${BASE_URL}/v1/tryon/history`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to fetch try-on history");
    } catch {
      throw new Error(bodyText || "Failed to fetch try-on history");
    }
  }
  return res.json();
}

// ============================================================================
// Body Analysis API Functions
// ============================================================================

export interface BodyAnalysisResult {
  success: boolean;
  skinToneLabel?: string | null;
  skinHexes: string[];
  bodyShape?: string | null;
  bodyShapeReason?: string | null;
  fullBody: boolean;
  error?: string;
  processingTime?: number;
}

export type TryOnPermissionStatus =
  | "NONE"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

/**
 * Analyze a photo to detect body attributes (skin tone, body shape, etc.)
 * Used during Aura creation for AI-assisted attribute detection
 */
export async function analyzeBodyImage(
  photoFile: File,
): Promise<BodyAnalysisResult> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to analyze image");
  }

  const formData = new FormData();
  formData.append("photo", photoFile);

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const res = await fetch(`${BASE_URL}/aura/analyze-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const bodyText = await res.text();
      try {
        const err = JSON.parse(bodyText);
        return {
          success: false,
          skinHexes: [],
          fullBody: false,
          error: err.message || "Analysis failed",
        };
      } catch {
        return {
          success: false,
          skinHexes: [],
          fullBody: false,
          error: bodyText || "Analysis failed",
        };
      }
    }

    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === "AbortError") {
      console.warn("⏱️ Image analysis timed out after 30 seconds");
      return {
        success: false,
        skinHexes: [],
        fullBody: false,
        error: "Analysis timed out - please proceed with manual entry",
      };
    }

    // Handle network errors
    console.error("❌ Image analysis network error:", error);
    return {
      success: false,
      skinHexes: [],
      fullBody: false,
      error: "Network error - please check your connection and try again",
    };
  }
}

// ============================================================================
// AI RECOMMENDATION API Functions
// ============================================================================

export interface RecommendationRequest {
  occasion: "Formal" | "Party" | "Wedding" | "Casual luxury" | "Resort";
  top_k?: number;
  body_shape?: string;
  skin_tone?: string;
  size?: string;
  age?: number;
}

export interface RecommendationItem {
  id: string;
  score: number;
  final_score: number;
  score_label: string;
  description?: string;
  image?: string;
  title?: string;
  price_cents?: number;
}

export interface RecommendationsResponse {
  perfect_for_you: RecommendationItem[];
  good_for_you: RecommendationItem[];
  you_can_also_try: RecommendationItem[];
  count: number;
  warnings?: string[];
}

// Get AI-powered outfit recommendations
export async function getAIRecommendations(
  data: RecommendationRequest,
): Promise<RecommendationsResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to get AI recommendations");
  }

  console.log(
    "🤖 Sending AI Recommendation Request:",
    JSON.stringify(data, null, 2),
  );

  const res = await fetch(`${BASE_URL}/api/recommendations/ai-decide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Failed to get recommendations");
    } catch {
      throw new Error(bodyText || "Failed to get recommendations");
    }
  }
  return res.json();
}

/**
 * Request permission to use virtual try-on
 */
export async function requestTryOnAccess(): Promise<{
  success: boolean;
  message?: string;
}> {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Login required");

  const res = await fetch(`${BASE_URL}/auth/try-on-permission/request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: "Failed to request access" }));
    throw new Error(err.message);
  }

  return { success: true };
}

/**
 * (Admin) Get all pending try-on permission requests
 */
export async function getPendingTryOnPermissions(): Promise<TryOnPermission[]> {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Login required");

  const res = await fetch(`${BASE_URL}/auth/admin/try-on-permissions/pending`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch requests");
  return res.json();
}

/**
 * (Admin) Get all approved try-on permission requests
 */
export async function getApprovedTryOnPermissions(): Promise<
  TryOnPermission[]
> {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Login required");

  const res = await fetch(
    `${BASE_URL}/auth/admin/try-on-permissions/approved`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) throw new Error("Failed to fetch requests");
  return res.json();
}

/**
 * (Admin) Approve or Reject a try-on permission request
 */
export async function resolveTryOnPermission(
  userId: string,
  status: TryOnPermissionStatus,
): Promise<void> {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Login required");

  const res = await fetch(
    `${BASE_URL}/auth/admin/try-on-permissions/resolve/${userId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!res.ok) throw new Error("Failed to resolve request");
}

// ============================================================================
// Address API Functions
// ============================================================================

import type {
  Address,
  CreateAddressParams,
} from "@/constants/address.constants";

// Get all addresses for current user
export async function getAddresses(): Promise<Address[]> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to view addresses");
  }

  const res = await fetch(`${BASE_URL}/addresses`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to fetch addresses");
  }
  return res.json();
}

// Get default address
export async function getDefaultAddress(): Promise<Address | null> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/addresses/default`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

// Create new address
export async function createAddress(
  data: CreateAddressParams,
): Promise<Address> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to add address");
  }

  const res = await fetch(`${BASE_URL}/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to create address");
  }
  return res.json();
}

// Update address
export async function updateAddress(
  addressId: string,
  data: Partial<CreateAddressParams>,
): Promise<Address> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to update address");
  }

  const res = await fetch(`${BASE_URL}/addresses/${addressId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to update address");
  }
  return res.json();
}

// Delete address
export async function deleteAddress(
  addressId: string,
): Promise<{ message: string }> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to delete address");
  }

  const res = await fetch(`${BASE_URL}/addresses/${addressId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to delete address");
  }
  return res.json();
}

// Set address as default
export async function setDefaultAddress(addressId: string): Promise<Address> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to set default address");
  }

  const res = await fetch(`${BASE_URL}/addresses/${addressId}/set-default`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to set default address");
  }
  return res.json();
}

// ============================================================================
// Wishlist API Functions
// ============================================================================

import type {
  WishlistAPIResponse,
  WishlistCheckResponse,
  WishlistToggleResponse,
  WishlistSummary,
} from "@/types/wishlist.types";

// Get user's wishlist
export async function getWishlist(): Promise<WishlistAPIResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to view wishlist");
  }

  const res = await fetch(`${BASE_URL}/wishlist`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to fetch wishlist");
  }
  return res.json();
}

// Get wishlist summary
export async function getWishlistSummary(): Promise<WishlistSummary> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return { item_count: 0, total_value_cents: 0, currency: "INR" };
  }

  try {
    const res = await fetch(`${BASE_URL}/wishlist/summary`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { item_count: 0, total_value_cents: 0, currency: "INR" };
    }
    return res.json();
  } catch {
    return { item_count: 0, total_value_cents: 0, currency: "INR" };
  }
}

// Check if product is in wishlist
export async function checkProductInWishlist(
  productId: string,
): Promise<WishlistCheckResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return { is_in_wishlist: false };
  }

  try {
    const res = await fetch(`${BASE_URL}/wishlist/check/${productId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { is_in_wishlist: false };
    }
    return res.json();
  } catch {
    return { is_in_wishlist: false };
  }
}

// Add product to wishlist
export async function addToWishlist(
  productId: string,
): Promise<WishlistAPIResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to add to wishlist");
  }

  const res = await fetch(`${BASE_URL}/wishlist/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id: productId }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to add to wishlist");
  }
  return res.json();
}

// Toggle product in wishlist (add/remove)
export async function toggleWishlist(
  productId: string,
): Promise<WishlistToggleResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    console.error("❌ No access token found");
    throw new Error("Please login to update wishlist");
  }

  console.log("🔄 Toggling wishlist for product:", productId);
  console.log("📍 Request URL:", `${BASE_URL}/wishlist/toggle/${productId}`);

  const res = await fetch(`${BASE_URL}/wishlist/toggle/${productId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("📥 Response status:", res.status, res.statusText);

  if (!res.ok) {
    const bodyText = await res.text();
    console.error("❌ Wishlist toggle failed:", {
      status: res.status,
      statusText: res.statusText,
      body: bodyText,
    });
    handleApiError(res, bodyText, "Failed to update wishlist");
  }

  const data = await res.json();
  console.log("✅ Wishlist toggle success:", data);
  return data;
}

// Remove item from wishlist by wishlist item ID
export async function removeFromWishlist(
  wishlistItemId: string,
): Promise<WishlistAPIResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to remove from wishlist");
  }

  const res = await fetch(`${BASE_URL}/wishlist/items/${wishlistItemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to remove from wishlist");
  }
  return res.json();
}

// Remove item from wishlist by product ID
export async function removeFromWishlistByProductId(
  productId: string,
): Promise<WishlistAPIResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to remove from wishlist");
  }

  const res = await fetch(`${BASE_URL}/wishlist/product/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to remove from wishlist");
  }
  return res.json();
}

// Move wishlist item to cart
export async function moveWishlistItemToCart(
  wishlistItemId: string,
): Promise<{ message: string }> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to move item to cart");
  }

  const res = await fetch(
    `${BASE_URL}/wishlist/items/${wishlistItemId}/move-to-cart`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to move item to cart");
  }
  return res.json();
}

// Clear entire wishlist
export async function clearWishlist(): Promise<{ message: string }> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to clear wishlist");
  }

  const res = await fetch(`${BASE_URL}/wishlist`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to clear wishlist");
  }
  return res.json();
}

// ============================================================================
// Enterprise Cart API Functions
// ============================================================================

export interface CartItemAPI {
  cart_item_id: string;
  product_id: string;
  quantity: number;
  size?: string;
  color?: string;
  price_cents_snapshot: number;
  currency_snapshot: string;
  added_at: string;
  product: {
    product_id: string;
    title: string;
    slug: string;
    price_cents: number;
    currency: string;
    inventory_count: number;
    category: string;
    creator: {
      creator_id: string;
      store_name: string;
      store_slug: string;
    };
    images: Array<{
      image_id: string;
      url: string;
      is_primary: boolean;
      order_index: number;
    }>;
  };
}

export interface CartSummaryAPI {
  item_count: number;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
}

export interface CartAPIResponse {
  cart_id: string;
  user_id: string;
  applied_coupon_code?: string | null;
  items: CartItemAPI[];
  summary: CartSummaryAPI;
  created_at: string;
  updated_at: string;
}

export interface GuestCartAPIResponse {
  guest_cart_id: string;
  session_id: string;
  applied_coupon_code?: string | null;
  expires_at: string;
  items: Array<CartItemAPI & { guest_cart_item_id: string }>;
  summary: CartSummaryAPI;
}

export interface AddToCartRequest {
  product_id: string;
  quantity?: number;
  size?: string;
  color?: string;
}

export interface MergeResult {
  merged_items: number;
  dropped_items: number;
  capped_items: number;
  price_updated_items: number;
  dropped_reasons: string[];
}

// Get authenticated user's cart
export async function getUserCart(): Promise<CartAPIResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to view cart");
  }

  const res = await fetch(`${BASE_URL}/cart`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to fetch cart");
  }
  return res.json();
}

// Get guest cart (no auth required)
export async function getGuestCart(): Promise<GuestCartAPIResponse> {
  const res = await fetch(`${BASE_URL}/cart/guest`, {
    method: "GET",
    credentials: "include", // Important: send cookies
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(bodyText || "Failed to fetch guest cart");
  }
  return res.json();
}

// Add item to authenticated user's cart
export async function addToUserCart(
  data: AddToCartRequest,
): Promise<CartAPIResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to add to cart");
  }

  const res = await fetch(`${BASE_URL}/cart/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to add to cart");
  }
  return res.json();
}

// Add item to guest cart (no auth required)
export async function addToGuestCart(
  data: AddToCartRequest,
): Promise<GuestCartAPIResponse> {
  const res = await fetch(`${BASE_URL}/cart/guest/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include", // Important: send cookies
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(bodyText || "Failed to add to guest cart");
  }
  return res.json();
}

// Update authenticated user's cart item
export async function updateUserCartItem(
  cartItemId: string,
  quantity: number,
): Promise<CartAPIResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to update cart");
  }

  const res = await fetch(`${BASE_URL}/cart/items/${cartItemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
    credentials: "include",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to update cart item");
  }
  return res.json();
}

// Update guest cart item
export async function updateGuestCartItem(
  cartItemId: string,
  quantity: number,
): Promise<GuestCartAPIResponse> {
  const res = await fetch(`${BASE_URL}/cart/guest/items/${cartItemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ quantity }),
    credentials: "include",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(bodyText || "Failed to update guest cart item");
  }
  return res.json();
}

// Remove item from authenticated user's cart
export async function removeFromUserCart(
  cartItemId: string,
): Promise<CartAPIResponse> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to remove from cart");
  }

  const res = await fetch(`${BASE_URL}/cart/items/${cartItemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to remove from cart");
  }
  return res.json();
}

// Remove item from guest cart
export async function removeFromGuestCart(
  cartItemId: string,
): Promise<GuestCartAPIResponse> {
  const res = await fetch(`${BASE_URL}/cart/guest/items/${cartItemId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(bodyText || "Failed to remove from guest cart");
  }
  return res.json();
}

// Clear authenticated user's cart
export async function clearUserCart(): Promise<{ message: string }> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to clear cart");
  }

  const res = await fetch(`${BASE_URL}/cart`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to clear cart");
  }
  return res.json();
}

// Clear guest cart
export async function clearGuestCart(): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/cart/guest`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(bodyText || "Failed to clear guest cart");
  }
  return res.json();
}

// Merge guest cart into user cart (called on login)
export async function mergeCart(): Promise<{
  cart: CartAPIResponse;
  mergeResult: MergeResult;
}> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Please login to merge cart");
  }

  const res = await fetch(`${BASE_URL}/cart/merge`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include", // Important: send cookies for guest session
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, "Failed to merge cart");
  }
  return res.json();
}

// ============================================================================
// Product Groups API Functions
// ============================================================================

export async function getCreatorGroups() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to view groups');
  }

  const res = await fetch(`${BASE_URL}/product-groups`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to fetch groups');
    } catch {
      throw new Error(bodyText || 'Failed to fetch groups');
    }
  }
  return res.json();
}

export async function createProductGroup(data: { name: string; description?: string; parent_id?: string }) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to create groups');
  }

  const res = await fetch(`${BASE_URL}/product-groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to create group');
    } catch {
      throw new Error(bodyText || 'Failed to create group');
    }
  }
  return res.json();
}

export async function updateProductGroup(id: string, data: { name?: string; description?: string; parent_id?: string | null }) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to update groups');
  }

  const res = await fetch(`${BASE_URL}/product-groups/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to update group');
    } catch {
      throw new Error(bodyText || 'Failed to update group');
    }
  }
  return res.json();
}

export async function deleteProductGroup(id: string) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to delete groups');
  }

  const res = await fetch(`${BASE_URL}/product-groups/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to delete group');
    } catch {
      throw new Error(bodyText || 'Failed to delete group');
    }
  }
  return res.json();
}

// ==========================================
// CATEGORIES & SUBCATEGORIES
// ==========================================

export interface Category {
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: SubCategory[];
}

export interface SubCategory {
  sub_category_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCategories() {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getAdminCategories() {
  const res = await fetch(`${BASE_URL}/admin/categories`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = 'Failed to fetch admin categories';
    try { msg = JSON.parse(txt).message; } catch { }
    throw new Error(msg);
  }
  return res.json();
}

export async function createCategory(data: Partial<Category>) {
  const res = await fetch(`${BASE_URL}/admin/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = 'Failed to create category';
    try { msg = JSON.parse(txt).message; } catch { }
    throw new Error(msg);
  }
  return res.json();
}

export async function updateCategory(id: string, data: Partial<Category>) {
  const res = await fetch(`${BASE_URL}/admin/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = 'Failed to update category';
    try { msg = JSON.parse(txt).message; } catch { }
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteCategory(id: string) {
  const res = await fetch(`${BASE_URL}/admin/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = 'Failed to delete category';
    try { msg = JSON.parse(txt).message; } catch { }
    throw new Error(msg);
  }
  return res.json();
}

export async function createSubCategory(categoryId: string, data: Partial<SubCategory>) {
  const res = await fetch(`${BASE_URL}/admin/categories/${categoryId}/subcategories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = 'Failed to create subcategory';
    try { msg = JSON.parse(txt).message; } catch { }
    throw new Error(msg);
  }
  return res.json();
}

export async function updateSubCategory(id: string, data: Partial<SubCategory>) {
  const res = await fetch(`${BASE_URL}/admin/subcategories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = 'Failed to update subcategory';
    try { msg = JSON.parse(txt).message; } catch { }
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteSubCategory(id: string) {
  const res = await fetch(`${BASE_URL}/admin/subcategories/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = 'Failed to delete subcategory';
    try { msg = JSON.parse(txt).message; } catch { }
    throw new Error(msg);
  }
  return res.json();
}
