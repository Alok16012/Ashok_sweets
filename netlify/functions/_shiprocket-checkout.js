// netlify/functions/_shiprocket-checkout.js
// Shared signing + transport for the Shiprocket Checkout (SRC) API.
//
// Auth is a base64 HMAC-SHA256 of the *exact* request body bytes, keyed with the
// API secret. The signature is computed over the serialized string we send, so
// the same string must be handed to both the HMAC and fetch — re-serializing the
// object would change key order and invalidate the signature.
//
// Env (server-only — never expose the secret with a VITE_ prefix):
//   SHIPROCKET_CHECKOUT_API_KEY
//   SHIPROCKET_CHECKOUT_API_SECRET
//   SHIPROCKET_CHECKOUT_BASE_URL (optional; defaults to production)

const crypto = require("crypto");

const BASE_URL =
  process.env.SHIPROCKET_CHECKOUT_BASE_URL ||
  "https://checkout-api.shiprocket.com";

const API_KEY = process.env.SHIPROCKET_CHECKOUT_API_KEY || "";
const API_SECRET = process.env.SHIPROCKET_CHECKOUT_API_SECRET || "";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function credentialsConfigured() {
  return Boolean(API_KEY && API_SECRET);
}

/**
 * Calls a Shiprocket Checkout endpoint with a signed body.
 * Returns { ok, status, data } — never throws for HTTP-level failures, so
 * callers can surface a real error instead of inventing a success.
 */
async function callShiprocket(path, payload) {
  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(body, "utf8")
    .digest("base64");

  const response = await fetch(BASE_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": API_KEY,
      "X-Api-HMAC-SHA256": signature,
    },
    body,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

/**
 * Maps Shiprocket's failure modes onto a message worth showing a customer.
 * 401/511 mean our own credentials are wrong, which is never the shopper's
 * problem — so it stays generic on the surface and specific in the logs.
 */
function describeFailure(status, data) {
  if (status === 401 || status === 511) {
    return "Checkout is misconfigured. Please contact the store.";
  }
  const message = data && data.error && data.error.message;
  return message || "Checkout is unavailable right now. Please try again.";
}

module.exports = {
  BASE_URL,
  JSON_HEADERS,
  credentialsConfigured,
  callShiprocket,
  describeFailure,
};
