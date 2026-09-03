/**
 * POST /api/shiprocket/shipment
 * Creates a Shiprocket order with COD (Cash on Delivery).
 *
 * This combines: client order + Shiprocket shipment in one call.
 *
 * Expected body:
 * {
 *   order_id: string,
 *   customer_details: { name, email, phone, address },
 *   items: [{ variant_id, quantity, price, title, sku }],
 *   coupon_code?: string,
 *   discount_amount?: number
 * }
 *
 * Response: { order_id, shipment_id, tracking_number, courier_name, status }
 */
import { shiprocketFetch } from "./auth.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      order_id,
      customer_details,
      items,
      coupon_code,
      discount_amount,
    } = body;

    // Generate order ID if not provided
    const generatedOrderId =
      order_id || `ASHOK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Extract customer details with defaults
    const customerName = customer_details?.name || "Guest Customer";
    const phone = customer_details?.phone || "9999999999";
    const email = customer_details?.email || "guest@ashoksweets.com";
    const address = customer_details?.address || "Dombivli, Maharashtra";

    // Build address parts
    const addressParts = address.split(",").map((s) => s.trim());
    const billing_address = addressParts[0] || "Dombivli";
    const billing_city = addressParts[1] || "Dombivli";
    const billing_state = addressParts[2] || "Maharashtra";
    const billing_pincode = addressParts[3] || "421201";

    // Build order items for Shiprocket
    const orderItems = items.map((item) => ({
      name: item.title || item.catalog_data?.name || "Product",
      sku: item.sku || item.catalog_data?.sku || "N/A",
      units: item.quantity || 1,
      selling_price: item.price || item.catalog_data?.price || 0,
      discount: discount_amount || 0,
      tax: 0,
    }));

    // Create Shiprocket order with COD
    const shiprocketPayload = {
      order_id: generatedOrderId,
      order_date: new Date().toISOString().split("T")[0],
      billing_customer_name: customerName,
      billing_address,
      billing_city,
      billing_pincode,
      billing_state,
      billing_country: "India",
      billing_email: email,
      billing_phone: phone,
      payment_method: "COD",
      shipping_is_billing: true,
      order_items: orderItems,
    };

    console.log(
      "[Shiprocket COD] Creating shipment:",
      JSON.stringify(shiprocketPayload, null, 2)
    );

    const result = await shiprocketFetch("/orders/create/adhoc", {
      method: "POST",
      body: shiprocketPayload,
    });

    console.log("[Shiprocket COD] Response:", JSON.stringify(result, null, 2));

    // If courier not auto-assigned, try to get available couriers
    let courierName = "Auto-assigned";
    let trackingNumber = result.tracking_number || result.awb_code || null;

    if (!trackingNumber && result.shipment_id) {
      try {
        const couriers = await shiprocketFetch(
          `/shipments/${result.shipment_id}/generate-label`,
          { method: "GET" }
        );
        trackingNumber = couriers.awb_code || trackingNumber;
        courierName = couriers.courier_company || courierName;
      } catch (err) {
        console.warn("[Shiprocket] Could not generate label:", err.message);
      }
    }

    return Response.json({
      success: true,
      order_id: generatedOrderId,
      shipment_id: result.shipment_id,
      tracking_number: trackingNumber,
      courier_name: courierName,
      status: result.status || "created",
      data: result,
    });
  } catch (error) {
    console.error("[Shiprocket COD] Error:", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Failed to create COD shipment",
        // Return order_id so frontend can still show success
        order_id: `ASHOK-${Date.now()}`,
      },
      { status: 502 }
    );
  }
}
