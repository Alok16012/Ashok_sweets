/**
 * POST /api/shiprocket/orders
 * Create an order in Shiprocket.
 *
 * Expected body (matches client API cart_data + customer_details):
 * {
 *   order_id: string,
 *   order_date: string (optional, ISO),
 *   billing_customer_name: string,
 *   billing_address: string,
 *   billing_city: string,
 *   billing_pincode: string,
 *   billing_state: string,
 *   billing_country: string,
 *   billing_email: string,
 *   billing_phone: string,
 *   payment_method: "COD" | "PREPAID",
 *   shipping_is_billing: boolean,
 *   order_items: [
 *     {
 *       name: string,
 *       sku: string,
 *       units: number,
 *       selling_price: number,
 *       discount?: number,
 *       tax?: number
 *     }
 *   ]
 * }
 *
 * Response: { order_id, shipment_id, status }
 */
import { shiprocketFetch } from "./auth.js";

export async function POST(request) {
  try {
    const payload = await request.json();

    // Validate required fields
    const required = [
      "order_id",
      "billing_customer_name",
      "billing_address",
      "billing_city",
      "billing_pincode",
      "billing_state",
      "billing_country",
      "billing_email",
      "billing_phone",
      "payment_method",
      "order_items",
    ];

    const missing = required.filter((field) => !payload[field]);
    if (missing.length > 0) {
      return Response.json(
        {
          success: false,
          error: `Missing required fields: ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Map to Shiprocket format
    const shiprocketOrder = {
      order_id: payload.order_id,
      order_date: payload.order_date || new Date().toISOString(),
      billing_customer_name: payload.billing_customer_name,
      billing_address: payload.billing_address,
      billing_city: payload.billing_city,
      billing_pincode: payload.billing_pincode,
      billing_state: payload.billing_state,
      billing_country: payload.billing_country || "India",
      billing_email: payload.billing_email,
      billing_phone: payload.billing_phone,
      payment_method: payload.payment_method || "COD",
      shipping_is_billing: payload.shipping_is_billing !== false,
      order_items: payload.order_items.map((item) => ({
        name: item.name,
        sku: item.sku || "N/A",
        units: item.units || item.quantity || 1,
        selling_price: item.selling_price || item.price || 0,
        discount: item.discount || "0.00",
        tax: item.tax || "0.00",
      })),
    };

    console.log("[Shiprocket] Creating order:", JSON.stringify(shiprocketOrder, null, 2));

    const result = await shiprocketFetch("/orders/create/adhoc", {
      method: "POST",
      body: shiprocketOrder,
    });

    console.log("[Shiprocket] Order created:", JSON.stringify(result, null, 2));

    return Response.json({
      success: true,
      order_id: result.order_id,
      shipment_id: result.shipment_id,
      status: result.status || "created",
      data: result,
    });
  } catch (error) {
    console.error("[Shiprocket] Order creation error:", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Failed to create order in Shiprocket",
      },
      { status: 502 }
    );
  }
}
