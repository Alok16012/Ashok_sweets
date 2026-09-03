// netlify/functions/order-status.js
// Get order status by order_id

const CLIENT_API_BASE = process.env.CLIENT_API_BASE_URL || "https://api.example.com/api/v1";
const CLIENT_API_KEY = process.env.CLIENT_API_KEY || "";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: "Method not allowed" }) };
  }

  const url = new URL(event.rawUrl || `http://localhost${event.path}`);
  const orderId = url.pathname.split("/").pop();

  if (!orderId) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "order_id is required" }) };
  }

  try {
    const apiRes = await fetch(`${CLIENT_API_BASE}/orders/${encodeURIComponent(orderId)}`, {
      headers: { "Content-Type": "application/json", "X-API-Key": CLIENT_API_KEY }
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, order: data }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, order: { order_id: orderId, status: "pending", note: "Order not found in client API" } }) };
  } catch (error) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, order: { order_id: orderId, status: "unknown", error: error.message } }) };
  }
};
