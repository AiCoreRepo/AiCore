const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
    try {
      const parsed = JSON.parse(bodyText);
      console.error("Error response:", parsed);
      throw new Error(parsed.message || "Login failed");
    } catch {
      console.error("Error response (text):", bodyText);
      throw new Error(bodyText || "Login failed");
    }
  }

  const responseData = await res.json();
  // SECURITY: Do not log tokens or sensitive data
  console.log("Login successful");
  return responseData;
}

export async function signup(data: { email: string; password: string; brandName: string }) {
  // Always send role: 'creator' for creator signups
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      role: "CREATOR",
      store_name: data.brandName,
    }),
    credentials: "include",
  });
  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Signup failed");
    } catch {
      throw new Error(bodyText || "Signup failed");
    }
  }
  return res.json();
}

// User signup for regular users (buyers)
export async function userSignup(data: { email: string; password: string; name?: string }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      role: "BUYER",
      name: data.name,
    }),
    credentials: "include",
  });
  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || "Signup failed");
    } catch {
      throw new Error(bodyText || "Signup failed");
    }
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
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to fetch dashboard metrics');
    } catch {
      throw new Error(bodyText || 'Failed to fetch dashboard metrics');
    }
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
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to fetch products');
    } catch {
      throw new Error(bodyText || 'Failed to fetch products');
    }
  }
  return res.json();
}

export async function getProfile() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const res = await fetch(`${BASE_URL}/creator-dashboard/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to fetch profile');
    } catch {
      throw new Error(bodyText || 'Failed to fetch profile');
    }
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
    try {
      const err = JSON.parse(bodyText);
      throw new Error(err.message || 'Failed to update profile');
    } catch {
      throw new Error(bodyText || 'Failed to update profile');
    }
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
export async function addComment(productId: string, commentText: string) {
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
    body: JSON.stringify({ product_id: productId, comment_text: commentText }),
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
