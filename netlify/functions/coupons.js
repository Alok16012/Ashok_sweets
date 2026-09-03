// netlify/functions/coupons.js
// Coupon management: list, create, update, delete

const CLIENT_API_BASE = process.env.CLIENT_API_BASE_URL || "https://api.example.com/api/v1";
const CLIENT_API_KEY = process.env.CLIENT_API_KEY || "";

const FALLBACK_COUPONS = [
  { id: 1, code: "WELCOME10", discount_type: "percentage", discount_value: 10, min_order_amount: 500, active: true },
  { id: 2, code: "FESTIVE50", discount_type: "fixed", discount_value: 50, min_order_amount: 1000, active: true }
];

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const url = new URL(event.rawUrl || `http://localhost${event.path}`);
  const pathParts = url.pathname.replace(/^\/\.netlify\/functions\/coupons\/?/, "").split("/").filter(Boolean);
  const couponId = pathParts[0];

  // GET - list all coupons or get single
  if (event.httpMethod === "GET") {
    let coupons = [...FALLBACK_COUPONS];

    try {
      const apiRes = await fetch(`${CLIENT_API_BASE}/coupons`, {
        headers: { "Content-Type": "application/json", "X-API-Key": CLIENT_API_KEY }
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        const remote = data?.data?.coupons || data?.coupons;
        if (Array.isArray(remote) && remote.length > 0) coupons = remote;
      }
    } catch {}

    if (couponId && !isNaN(parseInt(couponId))) {
      const found = coupons.find(c => c.id === parseInt(couponId));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, coupon: found || null }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, coupons, count: coupons.length }) };
  }

  // POST - create coupon
  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body || "{}");
    const newCoupon = { id: Date.now(), ...body, active: body.active !== false };
    FALLBACK_COUPONS.push(newCoupon);
    return { statusCode: 201, headers, body: JSON.stringify({ success: true, coupon: newCoupon }) };
  }

  // PUT - update coupon
  if (event.httpMethod === "PUT" && couponId) {
    const body = JSON.parse(event.body || "{}");
    const idx = FALLBACK_COUPONS.findIndex(c => c.id === parseInt(couponId));
    if (idx >= 0) {
      FALLBACK_COUPONS[idx] = { ...FALLBACK_COUPONS[idx], ...body };
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, coupon: FALLBACK_COUPONS[idx] }) };
    }
    return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: "Coupon not found" }) };
  }

  // DELETE - delete coupon
  if (event.httpMethod === "DELETE" && couponId) {
    const idx = FALLBACK_COUPONS.findIndex(c => c.id === parseInt(couponId));
    if (idx >= 0) {
      const deleted = FALLBACK_COUPONS.splice(idx, 1)[0];
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, coupon: deleted }) };
    }
    return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: "Coupon not found" }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: "Method not allowed" }) };
};
