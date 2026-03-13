const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
      typeof err?.message === 'string'
        ? err.message
        : typeof err?.message?.message === 'string'
          ? err.message.message
          : Array.isArray(err?.message)
            ? err.message.join(', ')
            : undefined;

    return {
      message: nestedMessage || defaultMessage,
      code:
        typeof err?.code === 'string'
          ? err.code
          : typeof err?.message?.code === 'string'
            ? err.message.code
            : undefined,
      tryOnsUsed:
        typeof err?.tryOnsUsed === 'number'
          ? err.tryOnsUsed
          : typeof err?.message?.tryOnsUsed === 'number'
            ? err.message.tryOnsUsed
            : undefined,
      maxTryOns:
        typeof err?.maxTryOns === 'number'
          ? err.maxTryOns
          : typeof err?.message?.maxTryOns === 'number'
            ? err.message.maxTryOns
            : undefined,
      upgradeRequired:
        typeof err?.upgradeRequired === 'boolean'
          ? err.upgradeRequired
          : typeof err?.message?.upgradeRequired === 'boolean'
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

// Helper function to handle API errors and trigger logout on 401
function handleApiError(res: Response, bodyText: string, defaultMessage: string): never {
  const parsedError = parseApiErrorBody(bodyText, defaultMessage);

  const error = new Error(parsedError.message) as ApiError;
  error.status = res.status;
  error.code = parsedError.code;
  error.tryOnsUsed = parsedError.tryOnsUsed;
  error.maxTryOns = parsedError.maxTryOns;
  error.upgradeRequired = parsedError.upgradeRequired;
  error.details = parsedError.details;

  // If it's a 401 Unauthorized, trigger auth-error event to logout
  if (res.status === 401) {
    console.log('🔒 401 Unauthorized - Triggering auth-error event');
    window.dispatchEvent(new Event('auth-error'));
  }

  throw error;
}

export interface TryOnPermission {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  status: TryOnPermissionStatus;
  createdAt: string;
  updatedAt: string;
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
  role: 'CREATOR' | 'BUYER' | 'ADMIN';
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
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const res = await fetch(`${BASE_URL}/creator-dashboard/metrics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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

export async function getCreatorProducts(page: number = 1, limit: number = 10) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const res = await fetch(`${BASE_URL}/creator-dashboard/products?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let message = 'Failed to fetch products';
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
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let message = 'Failed to fetch product';
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
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  // Use /auth/me endpoint which works for all roles (BUYER, CREATOR, ADMIN)
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to fetch profile');
  }
  return res.json();
}

export async function updateProfile(data: { name?: string; subtitle?: string; avatar?: string }) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const res = await fetch(`${BASE_URL}/creator-dashboard/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let message = 'Failed to update profile';
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

export async function createProduct(data: {
  title: string;
  description?: string;
  price_cents: number;
  currency?: string;
  inventory_count?: number;
  images: string[];
  tags?: Array<{ name: string }>;
}) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const res = await fetch(`${BASE_URL}/creator-dashboard/products`, {
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
      throw new Error(err.message || 'Failed to create product');
    } catch {
      throw new Error(bodyText || 'Failed to create product');
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
    status?: string;
  }
) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const res = await fetch(`${BASE_URL}/creator-dashboard/products/${productId}`, {
    method: 'PUT',
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
      throw new Error(err.message || 'Failed to update product');
    } catch {
      throw new Error(bodyText || 'Failed to update product');
    }
  }
  return res.json();
}

export async function deleteProduct(productId: string) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const res = await fetch(`${BASE_URL}/creator-dashboard/products/${productId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to delete product');
    } catch {
      throw new Error(bodyText || 'Failed to delete product');
    }
  }
  return res.json();
}

// Get user's dashboard stats
export async function getUserDashboardStats() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to view dashboard stats');
  }

  const res = await fetch(`${BASE_URL}/user-dashboard/stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to fetch dashboard stats');
    } catch {
      throw new Error(bodyText || 'Failed to fetch dashboard stats');
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
  const token = localStorage.getItem('access_token');
  if (!token) {
    return { hasAura: false, aura: null };
  }

  try {
    const res = await fetch(`${BASE_URL}/aura/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { hasAura: false, aura: null };
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching Aura status:', error);
    return { hasAura: false, aura: null };
  }
}

// Like or unlike a product
export async function likeProduct(productId: string) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to like products');
  }

  const res = await fetch(`${BASE_URL}/products/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id: productId }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to like product');
    } catch {
      throw new Error(bodyText || 'Failed to like product');
    }
  }
  return res.json();
}

// Add a comment to a product
export async function addComment(productId: string, commentText: string, images?: string[]) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to comment');
  }

  const res = await fetch(`${BASE_URL}/products/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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
      throw new Error(err.message || 'Failed to add comment');
    } catch {
      throw new Error(bodyText || 'Failed to add comment');
    }
  }
  return res.json();
}

// Get product likes count and user's like status
export async function getProductLikes(productId: string) {
  const token = localStorage.getItem('access_token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/products/${productId}/likes`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to get likes');
    } catch {
      throw new Error(bodyText || 'Failed to get likes');
    }
  }
  return res.json();
}

// Get product comments
export async function getProductComments(productId: string) {
  const res = await fetch(`${BASE_URL}/products/${productId}/comments`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to get comments');
    } catch {
      throw new Error(bodyText || 'Failed to get comments');
    }
  }
  return res.json();
}

// Delete a comment
export async function deleteComment(commentId: string) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to delete comments');
  }

  const res = await fetch(`${BASE_URL}/products/comment/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to delete comment');
    } catch {
      throw new Error(bodyText || 'Failed to delete comment');
    }
  }
  return res.json();
}

// ============================================================================
// AI Try-On API Functions
// ============================================================================

// Get user's Aura data
export async function getAura() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to view your Aura');
  }

  const res = await fetch(`${BASE_URL}/aura`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to fetch Aura');
    } catch {
      throw new Error(bodyText || 'Failed to fetch Aura');
    }
  }
  return res.json();
}

// Try-on with Gemini AI (fallbacks to Vertex endpoint since Gemini 3D route is disabled)
export async function tryOnWithGemini(data: {
  userId: string;
  clothingItemId: string;
  additionalParams?: Record<string, unknown>;
}) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to use AI Try-On');
  }

  const res = await fetch(`${BASE_URL}/v1/tryon/3d/vertex`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    handleApiError(res, await res.text(), 'Try-on failed');
  }
  return res.json();
}

// Try-on with Vertex AI
export async function tryOnWithVertex(data: {
  userId: string;
  clothingItemId: string;
  additionalParams?: Record<string, unknown>;
}) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to use AI Try-On');
  }

  const res = await fetch(`${BASE_URL}/v1/tryon/3d/vertex`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    handleApiError(res, await res.text(), 'Vertex try-on failed');
  }
  return res.json();
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
  if (params?.minRating !== undefined) search.set("minRating", String(params.minRating));
  if (params?.maxRating !== undefined) search.set("maxRating", String(params.maxRating));
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
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to generate more angles');
  }

  // Get aura if not provided
  let auraId = data.auraId;
  if (!auraId) {
    try {
      const auraData = await getAura();
      auraId = auraData.aura_id;
    } catch (error) {
      throw new Error('Failed to get Aura data. Please create your Aura first.');
    }
  }

  // Call new NestJS angle generation endpoint
  const res = await fetch(`${BASE_URL}/angles/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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
    handleApiError(res, await res.text(), 'Failed to generate more angles');
  }
  return res.json();
}




// Get user's try-on history
export async function getTryOnHistory() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to view try-on history');
  }

  const res = await fetch(`${BASE_URL}/v1/tryon/history`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to fetch try-on history');
    } catch {
      throw new Error(bodyText || 'Failed to fetch try-on history');
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

export type TryOnPermissionStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Analyze a photo to detect body attributes (skin tone, body shape, etc.)
 * Used during Aura creation for AI-assisted attribute detection
 */
export async function analyzeBodyImage(photoFile: File): Promise<BodyAnalysisResult> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to analyze image');
  }

  const formData = new FormData();
  formData.append('photo', photoFile);

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const res = await fetch(`${BASE_URL}/aura/analyze-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
          error: err.message || 'Analysis failed',
        };
      } catch {
        return {
          success: false,
          skinHexes: [],
          fullBody: false,
          error: bodyText || 'Analysis failed',
        };
      }
    }

    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === 'AbortError') {
      console.warn('⏱️ Image analysis timed out after 30 seconds');
      return {
        success: false,
        skinHexes: [],
        fullBody: false,
        error: 'Analysis timed out - please proceed with manual entry',
      };
    }

    // Handle network errors
    console.error('❌ Image analysis network error:', error);
    return {
      success: false,
      skinHexes: [],
      fullBody: false,
      error: 'Network error - please check your connection and try again',
    };
  }
}

// ============================================================================
// AI RECOMMENDATION API Functions
// ============================================================================

export interface RecommendationRequest {
  occasion: 'Formal' | 'Party' | 'Wedding' | 'Casual luxury' | 'Resort';
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
export async function getAIRecommendations(data: RecommendationRequest): Promise<RecommendationsResponse> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to get AI recommendations');
  }

  console.log('🤖 Sending AI Recommendation Request:', JSON.stringify(data, null, 2));

  const res = await fetch(`${BASE_URL}/api/recommendations/ai-decide`, {
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
      throw new Error(err.message || 'Failed to get recommendations');
    } catch {
      throw new Error(bodyText || 'Failed to get recommendations');
    }
  }
  return res.json();
}

/**
 * Request permission to use virtual try-on
 */
export async function requestTryOnAccess(): Promise<{ success: boolean; message?: string }> {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Login required');

  const res = await fetch(`${BASE_URL}/auth/try-on-permission/request`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to request access' }));
    throw new Error(err.message);
  }

  return { success: true };
}

/**
 * (Admin) Get all pending try-on permission requests
 */
export async function getPendingTryOnPermissions(): Promise<TryOnPermission[]> {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Login required');

  const res = await fetch(`${BASE_URL}/auth/admin/try-on-permissions/pending`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch requests');
  return res.json();
}

/**
 * (Admin) Get all approved try-on permission requests
 */
export async function getApprovedTryOnPermissions(): Promise<TryOnPermission[]> {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Login required');

  const res = await fetch(`${BASE_URL}/auth/admin/try-on-permissions/approved`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch requests');
  return res.json();
}

/**
 * (Admin) Approve or Reject a try-on permission request
 */
export async function resolveTryOnPermission(userId: string, status: TryOnPermissionStatus): Promise<void> {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Login required');

  const res = await fetch(`${BASE_URL}/auth/admin/try-on-permissions/resolve/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) throw new Error('Failed to resolve request');
}

// ============================================================================
// Address API Functions
// ============================================================================

import type { Address, CreateAddressParams } from '@/constants/address.constants';

// Get all addresses for current user
export async function getAddresses(): Promise<Address[]> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to view addresses');
  }

  const res = await fetch(`${BASE_URL}/addresses`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to fetch addresses');
  }
  return res.json();
}

// Get default address
export async function getDefaultAddress(): Promise<Address | null> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/addresses/default`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
export async function createAddress(data: CreateAddressParams): Promise<Address> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to add address');
  }

  const res = await fetch(`${BASE_URL}/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to create address');
  }
  return res.json();
}

// Update address
export async function updateAddress(addressId: string, data: Partial<CreateAddressParams>): Promise<Address> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to update address');
  }

  const res = await fetch(`${BASE_URL}/addresses/${addressId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to update address');
  }
  return res.json();
}

// Delete address
export async function deleteAddress(addressId: string): Promise<{ message: string }> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to delete address');
  }

  const res = await fetch(`${BASE_URL}/addresses/${addressId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to delete address');
  }
  return res.json();
}

// Set address as default
export async function setDefaultAddress(addressId: string): Promise<Address> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to set default address');
  }

  const res = await fetch(`${BASE_URL}/addresses/${addressId}/set-default`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to set default address');
  }
  return res.json();
}

// ============================================================================
// Wishlist API Functions
// ============================================================================

import type { WishlistAPIResponse, WishlistCheckResponse, WishlistToggleResponse, WishlistSummary } from '@/types/wishlist.types';

// Get user's wishlist
export async function getWishlist(): Promise<WishlistAPIResponse> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to view wishlist');
  }

  const res = await fetch(`${BASE_URL}/wishlist`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to fetch wishlist');
  }
  return res.json();
}

// Get wishlist summary
export async function getWishlistSummary(): Promise<WishlistSummary> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return { item_count: 0, total_value_cents: 0, currency: 'INR' };
  }

  try {
    const res = await fetch(`${BASE_URL}/wishlist/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { item_count: 0, total_value_cents: 0, currency: 'INR' };
    }
    return res.json();
  } catch {
    return { item_count: 0, total_value_cents: 0, currency: 'INR' };
  }
}

// Check if product is in wishlist
export async function checkProductInWishlist(productId: string): Promise<WishlistCheckResponse> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return { is_in_wishlist: false };
  }

  try {
    const res = await fetch(`${BASE_URL}/wishlist/check/${productId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
export async function addToWishlist(productId: string): Promise<WishlistAPIResponse> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to add to wishlist');
  }

  const res = await fetch(`${BASE_URL}/wishlist/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id: productId }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to add to wishlist');
  }
  return res.json();
}

// Toggle product in wishlist (add/remove)
export async function toggleWishlist(productId: string): Promise<WishlistToggleResponse> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('❌ No access token found');
    throw new Error('Please login to update wishlist');
  }

  console.log('🔄 Toggling wishlist for product:', productId);
  console.log('📍 Request URL:', `${BASE_URL}/wishlist/toggle/${productId}`);

  const res = await fetch(`${BASE_URL}/wishlist/toggle/${productId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  console.log('📥 Response status:', res.status, res.statusText);

  if (!res.ok) {
    const bodyText = await res.text();
    console.error('❌ Wishlist toggle failed:', {
      status: res.status,
      statusText: res.statusText,
      body: bodyText
    });
    handleApiError(res, bodyText, 'Failed to update wishlist');
  }

  const data = await res.json();
  console.log('✅ Wishlist toggle success:', data);
  return data;
}

// Remove item from wishlist by wishlist item ID
export async function removeFromWishlist(wishlistItemId: string): Promise<WishlistAPIResponse> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to remove from wishlist');
  }

  const res = await fetch(`${BASE_URL}/wishlist/items/${wishlistItemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to remove from wishlist');
  }
  return res.json();
}

// Remove item from wishlist by product ID
export async function removeFromWishlistByProductId(productId: string): Promise<WishlistAPIResponse> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to remove from wishlist');
  }

  const res = await fetch(`${BASE_URL}/wishlist/product/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to remove from wishlist');
  }
  return res.json();
}

// Move wishlist item to cart
export async function moveWishlistItemToCart(wishlistItemId: string): Promise<{ message: string }> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to move item to cart');
  }

  const res = await fetch(`${BASE_URL}/wishlist/items/${wishlistItemId}/move-to-cart`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to move item to cart');
  }
  return res.json();
}

// Clear entire wishlist
export async function clearWishlist(): Promise<{ message: string }> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to clear wishlist');
  }

  const res = await fetch(`${BASE_URL}/wishlist`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to clear wishlist');
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
  items: CartItemAPI[];
  summary: CartSummaryAPI;
  created_at: string;
  updated_at: string;
}

export interface GuestCartAPIResponse {
  guest_cart_id: string;
  session_id: string;
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
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to view cart');
  }

  const res = await fetch(`${BASE_URL}/cart`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to fetch cart');
  }
  return res.json();
}

// Get guest cart (no auth required)
export async function getGuestCart(): Promise<GuestCartAPIResponse> {
  const res = await fetch(`${BASE_URL}/cart/guest`, {
    method: 'GET',
    credentials: 'include', // Important: send cookies
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(bodyText || 'Failed to fetch guest cart');
  }
  return res.json();
}

// Add item to authenticated user's cart
export async function addToUserCart(data: AddToCartRequest): Promise<CartAPIResponse> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to add to cart');
  }

  const res = await fetch(`${BASE_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to add to cart');
  }
  return res.json();
}

// Add item to guest cart (no auth required)
export async function addToGuestCart(data: AddToCartRequest): Promise<GuestCartAPIResponse> {
  const res = await fetch(`${BASE_URL}/cart/guest/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include', // Important: send cookies
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(bodyText || 'Failed to add to guest cart');
  }
  return res.json();
}

// Update authenticated user's cart item
export async function updateUserCartItem(cartItemId: string, quantity: number): Promise<CartAPIResponse> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to update cart');
  }

  const res = await fetch(`${BASE_URL}/cart/items/${cartItemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
    credentials: 'include',
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to update cart item');
  }
  return res.json();
}

// Update guest cart item
export async function updateGuestCartItem(cartItemId: string, quantity: number): Promise<GuestCartAPIResponse> {
  const res = await fetch(`${BASE_URL}/cart/guest/items/${cartItemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity }),
    credentials: 'include',
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(bodyText || 'Failed to update guest cart item');
  }
  return res.json();
}

// Remove item from authenticated user's cart
export async function removeFromUserCart(cartItemId: string): Promise<CartAPIResponse> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to remove from cart');
  }

  const res = await fetch(`${BASE_URL}/cart/items/${cartItemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to remove from cart');
  }
  return res.json();
}

// Remove item from guest cart
export async function removeFromGuestCart(cartItemId: string): Promise<GuestCartAPIResponse> {
  const res = await fetch(`${BASE_URL}/cart/guest/items/${cartItemId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(bodyText || 'Failed to remove from guest cart');
  }
  return res.json();
}

// Clear authenticated user's cart
export async function clearUserCart(): Promise<{ message: string }> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to clear cart');
  }

  const res = await fetch(`${BASE_URL}/cart`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to clear cart');
  }
  return res.json();
}

// Clear guest cart
export async function clearGuestCart(): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/cart/guest`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(bodyText || 'Failed to clear guest cart');
  }
  return res.json();
}

// Merge guest cart into user cart (called on login)
export async function mergeCart(): Promise<{ cart: CartAPIResponse; mergeResult: MergeResult }> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Please login to merge cart');
  }

  const res = await fetch(`${BASE_URL}/cart/merge`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include', // Important: send cookies for guest session
  });

  if (!res.ok) {
    const bodyText = await res.text();
    handleApiError(res, bodyText, 'Failed to merge cart');
  }
  return res.json();
}
