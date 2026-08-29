/**
 * GET /api/client/products
 * Optional query params:
 *   - collection_id: number
 *   - collection_handle: string
 *   - limit: number
 *   - page: number
 *   - startDate: ISO date
 *   - endDate: ISO date
 *
 * Response shape matches client doc:
 * [
 *   {
 *     "id": 632910392,
 *     "title": "...",
 *     "body_html": "...",
 *     "vendor": "...",
 *     "product_type": "...",
 *     "handle": "...",
 *     "tags": "...",
 *     "status": "active",
 *     "variants": [
 *       {
 *         "id": 808950810,
 *         "title": "Pink",
 *         "price": "199.00",
 *         "compare_at_price": "299.00",
 *         "sku": "IPOD2008PINK",
 *         "quantity": 42,
 *         "grams": 567,
 *         "weight": 1.25,
 *         "weight_unit": "lb",
 *         "option_values": {"Color":"Blue","Size":"32"}
 *       }
 *     ],
 *     "image": {"src": "https://..."},
 *     "options": [{"name":"Color","values":["Blue","Red"]}]
 *   }
 * ]
 */
import { clientFetch } from "./_shared.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const collectionId = searchParams.get("collection_id");
    const collectionHandle = searchParams.get("collection_handle");
    const limit = searchParams.get("limit") || "50";
    const page = searchParams.get("page") || "1";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const qs = new URLSearchParams();
    if (collectionId) qs.set("collection_id", collectionId);
    if (collectionHandle) qs.set("handle", collectionHandle);
    qs.set("limit", limit);
    qs.set("page", page);
    if (startDate) qs.set("startDate", startDate);
    if (endDate) qs.set("endDate", endDate);

    const data = await clientFetch(`/products?${qs.toString()}`);

    // Some APIs wrap in { success, data } or similar — normalize to array if needed.
    const products = Array.isArray(data) ? data : data?.data || [];

    return Response.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("[client/products GET] error:", error);
    return Response.json(
      {
        success: false,
        error:
          error?.message || "Failed to fetch products from client API",
      },
      { status: 502 }
    );
  }
}
