/**
 * Client API Helper - Shopify-style e-commerce API
 *
 * Environment variables needed:
 * - VITE_CLIENT_API_BASE_URL: Base URL of the client's API (e.g. https://client-api.example.com/api/v1)
 * - VITE_CLIENT_API_KEY: API key for authentication (if required)
 */

const API_BASE = (typeof process !== 'undefined' && process.env?.VITE_CLIENT_API_BASE_URL) || "";
const API_KEY = (typeof process !== 'undefined' && process.env?.VITE_CLIENT_API_KEY) || "";

/**
 * Shared fetch wrapper for the client API.
 *
 * We expect JSON responses with the shapes shown in the client's Postman doc.
 */
export async function clientFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (API_KEY) {
    defaultHeaders["X-API-Key"] = API_KEY;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Client API error ${response.status}: ${errorText || response.statusText}`
    );
  }

  // Some endpoints may return empty body (204)
  const text = await response.text();
  if (!text) return null;

  return JSON.parse(text);
}

export { API_BASE, API_KEY };
