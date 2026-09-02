// netlify/functions/checkout.js
// Sends cart order to the actual client API

const CLIENT_API_BASE = process.env.VITE_CLIENT_API_BASE_URL || "https://api.example.com/api/v1";
const CLIENT_API_KEY = process.env.VITE_CLIENT_API_KEY || "";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { cart_data } = body;

    if (!cart_data || !Array.isArray(cart_data.items) || cart_data.items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Cart items are required" }) };
    }

    const apiRes = await fetch(`${CLIENT_API_BASE}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CLIENT_API_KEY
      },
      body: JSON.stringify({ cart_data })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`Client API responded ${apiRes.status}: ${errText}`);
    }

    const data = await apiRes.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        order_id: data.order_id || data.data?.order_id,
        redirect_url: data.redirect_url || data.data?.redirect_url,
        raw: data
      })
    };
  } catch (error) {
    console.error("[checkout] error:", error);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
