/**
 * GET /api/client/collection-products
 * Query params:
 *   - handle: string (collection handle, preferred)
 *   - collection_id: number (fallback)
 *   - limit: number
 *   - page: number
 *
 * Returns products inside the requested collection.
 */
import { clientFetch } from "./_shared.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");
    const collectionId = searchParams.get("collection_id");
    const limit = searchParams.get("limit") || "50";
    const page = searchParams.get("page") || "1";

    if (!handle && !collectionId) {
      return Response.json(
        {
          success: false,
          error: "Either 'handle' or 'collection_id' query parameter is required",
        },
        { status: 400 }
      );
    }

    // Prefer handle-based lookup as it matches the client's collection doc
    const qs = new URLSearchParams({ limit, page });
    if (handle) qs.set("handle", handle);
    if (collectionId) qs.set("collection_id", collectionId);

    // Typical Shopify-like endpoint; adjust if client uses a different path.
    const data = await clientFetch(`/collections/products?${qs.toString()}`);

    const products = Array.isArray(data) ? data : data?.data || [];

    return Response.json({
      success: true,
      collection: handle || collectionId,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("[client/collection-products GET] error:", error);
    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to fetch collection products from client API",
      },
      { status: 502 }
    );
  }
}
