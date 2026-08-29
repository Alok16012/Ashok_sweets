import crypto from "node:crypto";

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";
const AUTH_URL = `${SHIPROCKET_BASE}/auth/login`;
const CACHE_KEY = "shiprocket_token";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getCachedToken() {
  try {
    const raw = process.env.SHIPROCKET_TOKEN_CACHE;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.expiresAt && Date.now() < parsed.expiresAt) {
      return parsed.token;
    }
  } catch {
    // ignore malformed cache
  }
  return null;
}

function buildTokenCache(token: string): string {
  const payload = JSON.stringify({
    token,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return payload;
}

async function getShiprocketToken(): Promise<string> {
  // 1. Check cache first (hot path)
  const cached = getCachedToken();
  if (cached) return cached;

  // 2. Login
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error("SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be set");
  }

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok || !data.token) {
    throw new Error(
      data?.message || `Shiprocket auth failed (${response.status})`
    );
  }

  return data.token;
}

export async function getAuthenticatedToken(): Promise<string> {
  return getShiprocketToken();
}

export async function shiprocketFetch(
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    query?: Record<string, string | number | boolean | undefined>;
  } = {}
) {
  const { method = "GET", body, query } = options;
  const token = await getShiprocketToken();

  let url = `${SHIPROCKET_BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.message || `Shiprocket ${method} ${path} failed (${res.status})`
    );
  }

  return data;
}

export default { getAuthenticatedToken, shiprocketFetch };
