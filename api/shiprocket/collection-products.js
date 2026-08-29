import { shiprocketFetch } from "../shiprocket/auth.js";

/**
 * POST /api/shiprocket/collection-products
 * Body: {
 *   collection_id: number,
 *   product_ids: number[]   // array of Shiprocket product IDs
 * }
 *
 * Adds products to a specific collection in Shiprocket.
 * Replaces existing products in the collection with the new list.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { collection_id, product_ids } = body;

    if (!collection_id || !Array.isArray(product_ids)) {
      return Response.json(
        {
          success: false,
          error: "collection_id (number) and product_ids (array) are required",
        },
        { status: 400 }
      );
    }

    // Shiprocket API: Add products to collection
    // Endpoint: POST /v1/external/collection/{collection_id}/products
    const data = await shiprocketFetch(
      `/collection/${collection_id}/products`,
      {
        method: "POST",
        body: {
          product_ids: product_ids.map((id) => Number(id)),
        },
      }
    );

    return Response.json({
      success: true,
      message: `Products added to collection ${collection_id}`,
      collection_id,
      added_count: product_ids.length,
      shiprocket_response: data,
    });
  } catch (error) {
    console.error("[shiprocket/collection-products POST] error:", error);
    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to add products to collection in Shiprocket",
      },
      { status: 502 }
    );
  }
}

/**
 * GET /api/shiprocket/collection-products
 * Query params:
 *   - collection_id: number (required)
 *   - page: number (default 1)
 *   - per_page: number (default 100)
 *
 * Returns all products in a specific collection
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collection_id");

    if (!collectionId) {
      return Response.json(
        { success: false, error: "collection_id query parameter is required" },
        { status: 400 }
      );
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("per_page") || "100", 10);

    const data = await shiprocketFetch(
      `/collection/${collectionId}/products`,
      {
        query: { page, per_page: perPage },
      }
    );

    const products = Array.isArray(data?.data)
      ? data.data.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          description: p.description || "",
          price_inr: Math.round((p.selling_price || 0) / 100),
          stock: p.stock ?? 0,
          image_url: p.image_url || "",
          weight_g: p.weight || 500,
          category: p.category || "Sweets",
        }))
      : [];

    return Response.json({
      success: true,
      collection_id: collectionId,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("[shiprocket/collection-products GET] error:", error);
    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to fetch collection products from Shiprocket",
      },
      { status: 502 }
    );
  }
}
