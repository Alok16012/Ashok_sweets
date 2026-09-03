// netlify/functions/checkout-token.js
// POST /api/checkout/token
//
// Body: { items: [{ variant_id, quantity }], redirect_url }
// Returns: { success: true, token, order_id, expires_at }
//
// The token is what the browser hands to HeadlessCheckout.addToCart(). Address,
// coupon and payment are all collected by Shiprocket's own checkout screen, so
// nothing sensitive passes through here.

const {
  JSON_HEADERS,
  credentialsConfigured,
  callShiprocket,
  describeFailure,
} = require("./_shiprocket-checkout.js");

function fail(statusCode, error) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify({ success: false, error }),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return fail(405, "Method not allowed.");
  }
  if (!credentialsConfigured()) {
    console.error("[checkout-token] Shiprocket credentials are not set");
    return fail(500, "Checkout is not configured yet.");
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return fail(400, "Malformed request body.");
  }

  const { items, redirect_url: redirectUrl } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return fail(400, "Your cart is empty.");
  }
  if (!redirectUrl) {
    return fail(400, "redirect_url is required.");
  }

  // Shiprocket rejects non-numeric variant ids, and a variant missing from their
  // synced catalog fails later inside the checkout UI with no useful message —
  // so reject obviously bad ids here where we can still explain why.
  const cartItems = [];
  for (const item of items) {
    const variantId = String(item && item.variant_id ? item.variant_id : "").trim();
    const quantity = Number(item && item.quantity);

    if (!/^\d+$/.test(variantId)) {
      return fail(400, `Product is missing a valid variant id (got "${variantId}").`);
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return fail(400, "Every cart line needs a quantity of at least 1.");
    }
    cartItems.push({ variant_id: variantId, quantity });
  }

  const result = await callShiprocket("/api/v1/access-token/checkout", {
    cart_data: { items: cartItems, mobile_app: false },
    redirect_url: redirectUrl,
    timestamp: new Date().toISOString(),
  });

  const token = result.data && result.data.result && result.data.result.token;

  if (!result.ok || !token) {
    console.error(
      "[checkout-token] Shiprocket rejected the request:",
      result.status,
      JSON.stringify(result.data)
    );
    return fail(502, describeFailure(result.status, result.data));
  }

  const inner = result.data.result;
  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify({
      success: true,
      token,
      order_id: inner.data && inner.data.order_id,
      expires_at: inner.expires_at,
    }),
  };
};
