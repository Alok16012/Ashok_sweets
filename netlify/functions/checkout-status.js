// netlify/functions/checkout-status.js
// POST /api/checkout/status
//
// Body: { order_id }
// Returns: { success: true, order: { order_id, status, payment_status, ... } }
//
// Called by the order-success page so the confirmation reflects what Shiprocket
// actually recorded, rather than trusting the ost= value in the redirect URL.

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
    console.error("[checkout-status] Shiprocket credentials are not set");
    return fail(500, "Checkout is not configured yet.");
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return fail(400, "Malformed request body.");
  }

  const orderId = String(body.order_id || "").trim();
  if (!orderId) {
    return fail(400, "order_id is required.");
  }

  const result = await callShiprocket("/api/v1/custom-platform-order/details", {
    order_id: orderId,
    timestamp: new Date().toISOString(),
  });

  const order = result.data && result.data.result;

  if (!result.ok || !order) {
    console.error(
      "[checkout-status] lookup failed:",
      result.status,
      JSON.stringify(result.data)
    );
    return fail(502, describeFailure(result.status, result.data));
  }

  // Only the fields the confirmation screen needs. The full response carries the
  // shopper's address and phone, which the browser has no reason to receive.
  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify({
      success: true,
      order: {
        order_id: order.order_id,
        status: order.status,
        payment_type: order.payment_type,
        payment_status: order.payment_status,
        total_amount_payable: order.total_amount_payable,
        coupon_codes: order.coupon_codes,
        coupon_discount: order.coupon_discount,
        edd: order.edd,
        order_created_date: order.order_created_date,
      },
    }),
  };
};
