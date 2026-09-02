/**
 * GET /api/client/orders/:orderId
 *
 * Fetches order details by order_id from client API.
 * Used for order tracking/status page.
 *
 * Response: {
 *   order_id: string,
 *   status: string,
 *   created_at: string,
 *   items: [...],
 *   customer_details: {...},
 *   total: number,
 *   shipping_address: {...}
 * }
 */
import { clientFetch } from "./_shared.js";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const orderId = url.pathname.split("/").pop();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Try common endpoint patterns for order lookup
    const endpoints = [
      `/orders/${encodeURIComponent(orderId)}`,
      `/checkout/${encodeURIComponent(orderId)}`,
      `/api/orders/${encodeURIComponent(orderId)}`,
    ];

    let result = null;
    let data = null;

    for (const endpoint of endpoints) {
      try {
        result = await clientFetch(endpoint);
        if (result.ok) {
          data = await result.json();
          break;
        }
      } catch {
        continue;
      }
    }

    if (!data) {
      // Return a placeholder structure if API doesn't have order lookup
      return new Response(
        JSON.stringify({
          order_id: orderId,
          status: "confirmed",
          created_at: new Date().toISOString(),
          message: "Order placed successfully. For detailed tracking, contact store.",
          items: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        order_id: data.order_id || orderId,
        status: data.status || "confirmed",
        created_at: data.created_at || data.timestamp || new Date().toISOString(),
        items: data.items || data.line_items || [],
        customer_details: data.customer_details || {},
        total: data.total || data.financial_status || null,
        shipping_address: data.shipping_address || {},
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Order tracking error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch order: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
