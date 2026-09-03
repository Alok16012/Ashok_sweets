/**
 * POST /api/client/checkout
 * Cart validation, coupon application, and order creation in one step.
 *
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
 * Response: {
 *   success: true,
 *   order_id: string,
 *   timestamp: string,
 *   checkout_url?: string,
 *   raw: any
 * }
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

    // --- Validation ---
    if (!cart_data) {
      return new Response(
        JSON.stringify({ success: false, error: "cart_data is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(cart_data.items) || cart_data.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Cart is empty. Add items before checkout." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate each cart item
    for (const item of cart_data.items) {
      if (!item.variant_id || !item.quantity || item.quantity < 1) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Invalid cart item: variant_id and positive quantity required.`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Validate coupon if present
    let couponValid = true;
    if (cart_data.cart_discount?.coupon_code) {
      try {
        const couponRes = await fetch(`${request.url.replace(/\/checkout.*$/, "")}/coupons`, {
          method: "GET",
        });
        if (couponRes.ok) {
          const couponData = await couponRes.json();
          const coupons = couponData.coupons || [];
          const found = coupons.find(
            (c) => c.code?.toUpperCase() === cart_data.cart_discount.coupon_code.toUpperCase()
          );
          if (!found || !found.active) {
            couponValid = false;
          }
        }
      } catch {
        console.warn("[checkout] coupon validation skipped");
      }
    }

    if (!couponValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Coupon code "${cart_data.cart_discount.coupon_code}" is invalid or inactive.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- Build order payload ---
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

    // --- Submit to client checkout API ---
    const result = await clientFetch("/checkout", {
      method: "POST",
      body: orderPayload,
    });

    if (!result.ok) {
      const errorText = await result.text();
      console.error("[checkout] order creation failed:", result.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Order failed (${result.status}): ${errorText}`,
        }),
        { status: result.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await result.json();

    // Return standardized response
    return new Response(
      JSON.stringify({
        success: true,
        order_id: data.order_id || data.id || "ORD-" + Date.now(),
        timestamp: data.timestamp || new Date().toISOString(),
        checkout_url: data.checkout_url || data.web_url || undefined,
        redirect_url,
        raw: data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[checkout] error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Checkout failed: " + error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET /api/client/checkout
 * Optional: retrieve checkout status by order_id or token
 * Query params:
 *   - order_id: string
 *   - token: string
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");
    const token = searchParams.get("token");

    if (!orderId && !token) {
      return new Response(
        JSON.stringify({ success: false, error: "order_id or token is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Try to fetch from client API
    const endpoint = orderId ? `/orders/${orderId}` : `/checkouts/${token}`;
    const data = await clientFetch(endpoint, { method: "GET" });

    return Response.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error("[checkout GET] error:", error);
    return Response.json({
      success: true,
      order: null,
      message: "Checkout not found or API unavailable.",
    });
  }
}
