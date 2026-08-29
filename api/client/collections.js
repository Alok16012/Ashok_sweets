/**
 * GET /api/client/collections
 *
 * Response shape matches client doc:
 * [
 *   {
 *     "id": 482865238,
 *     "title": "Smart iPods",
 *     "handle": "smart-ipods",
 *     "image": {"src": "https://..."},
 *     "created_at": "2017-08-31T20:00:00-04:00",
 *     "updated_at": "2023-10-03T13:19:52-04:00"
 *   }
 * ]
 */
import { clientFetch } from "./_shared.js";

export async function GET(request) {
  try {
    const data = await clientFetch("/collections");

    const collections = Array.isArray(data) ? data : data?.data || [];

    const normalized = collections.map((c) => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
      description: c.description || c.body_html || "",
      image_url: c.image?.src || c.image_url || "",
      products_count: c.products_count ?? 0,
      created_at: c.created_at || "",
      updated_at: c.updated_at || "",
    }));

    return Response.json({
      success: true,
      count: normalized.length,
      collections: normalized,
    });
  } catch (error) {
    console.error("[client/collections GET] error:", error);
    return Response.json(
      {
        success: false,
        error:
          error?.message || "Failed to fetch collections from client API",
      },
      { status: 502 }
    );
  }
}
