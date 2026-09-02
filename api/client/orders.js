/**
 * POST /api/client/orders
 * Body: {
 *   cart_data: {
 *     items: [{ variant_id, quantity, catalog_data }],
 *     custom_attributes?: {},
 *     mobile_app?: boolean,
 *     cart_discount?: { coupon_code, amount }
 *   },
 *   customer_details?: { name, email, phone, address },
 *   redirect_url?: string
 * }
 *
 * Response: { order_id: string, timestamp: string }
 */
import { clientFetch } from "./_shared.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      cart_data,
      customer_details,
      redirect_url = "https://ashok-sweets.vercel.app/order-success",
    } = body;

    if (!cart_data || !Array.isArray(cart_data.items) || cart_data.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart is empty. Add items before placing order." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build order payload matching client's cart/checkout format
    const orderPayload = {
      line_items: cart_data.items.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        catalog_data: item.catalog_data || {},
      })),
      cart_discount: cart_data.cart_discount || {},
      custom_attributes: cart_data.custom_attributes || {},
      mobile_app: cart_data.mobile_app || false,
      redirect_url,
      customer_details: customer_details || {},
    };

    const result = await clientFetch("/checkout", {
      method: "POST",
      body: orderPayload,
    });

    if (!result.ok) {
      const errorText = await result.text();
      console.error("Order creation failed:", result.status, errorText);
      return new Response(
        JSON.stringify({ error: `Order failed: ${result.status} ${errorText}` }),
        { status: result.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await result.json();
    return new Response(
      JSON.stringify({
        order_id: data.order_id || data.id || "ORD-" + Date.now(),
        timestamp: data.timestamp || new Date().toISOString(),
        raw: data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Order API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create order: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
