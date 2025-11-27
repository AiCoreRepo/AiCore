const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function login(data: { email: string; password: string }) {
  // Hardcode endpoint to avoid any accidental whitespace
  const endpoint = BASE_URL + "/auth/login";
  console.log("Sending request to endpoint:", endpoint);
  console.log("Payload:", data);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  console.log("Response status:", res.status);
  console.log("Response headers:", res.headers);

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
  console.log("Response data:", responseData);
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
      role: "creator",
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

export async function getCreatorProducts() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const res = await fetch(`${BASE_URL}/creator-dashboard/products`, {
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

  const res = await fetch(`${BASE_URL}/auth/me`, {
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

export async function createProduct(data: {
  title: string;
  description?: string;
  price_cents: number;
  currency?: string;
  inventory_count?: number;
  image_urls: string[];
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
    image_urls?: string[];
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

export async function updateProfile(data: { name?: string; subtitle?: string; avatar?: string }) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const res = await fetch(`${BASE_URL}/auth/me`, {
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


