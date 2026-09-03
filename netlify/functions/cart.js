// netlify/functions/cart.js
// Validates cart and returns summary

const CLIENT_API_BASE = process.env.CLIENT_API_BASE_URL || "https://api.example.com/api/v1";
const CLIENT_API_KEY = process.env.CLIENT_API_KEY || "";

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
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Cart is empty" }) };
    }

    let subtotal = 0;
    const items = cart_data.items.map(item => {
      const price = parseFloat(item.catalog_data?.price || "0");
      const qty = parseInt(item.quantity || 0);
      const lineTotal = price * qty;
      subtotal += lineTotal;
      return { ...item, unit_price: price, line_total: lineTotal };
    });

    const discount = cart_data.cart_discount?.amount || 0;
    const total = Math.max(0, subtotal - discount);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        items,
        subtotal,
        discount,
        total,
        currency: "INR",
        item_count: items.reduce((sum, i) => sum + i.quantity, 0)
      })
    };
  } catch (error) {
    console.error("[cart] error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
