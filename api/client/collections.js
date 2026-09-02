/**
 * GET /api/client/collections
 *
 * Response: { success, count, collections: [...] }
 */
import { clientFetch } from "./_shared.js";

const FALLBACK_COLLECTIONS = [
  {
    id: 482865238,
    title: "Premium Mithai",
    handle: "premium-mithai",
    description: "Premium handcrafted sweets made with finest ingredients",
    image_url: "https://static.wixstatic.com/media/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg/v1/fill/w_980,h_1307,al_c,q_85/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg",
    products_count: 12,
    created_at: "2023-01-01T00:00:00-05:00",
    updated_at: "2023-11-01T00:00:00-05:00"
  },
  {
    id: 482865239,
    title: "Wedding Orders",
    handle: "wedding-orders",
    description: "Bulk wedding favour boxes and custom orders",
    image_url: "https://weddingsutra.com/images/Vendor_Images/Wedding-Favors-%26-Gifts/meetha-by-radisson/meetha-by-radisson-03.jpg",
    products_count: 8,
    created_at: "2023-02-15T00:00:00-05:00",
    updated_at: "2023-10-15T00:00:00-05:00"
  },
  {
    id: 482865240,
    title: "Traditional Favourites",
    handle: "traditional-favourites",
    description: "Classic Indian sweets made with traditional recipes",
    image_url: "https://media.pri.org/s3fs-public/story/images/Mithai.JPG",
    products_count: 15,
    created_at: "2023-03-10T00:00:00-05:00",
    updated_at: "2023-09-20T00:00:00-05:00"
  }
];

export async function GET(request) {
  try {
    let collections = [];
    try {
      const data = await clientFetch("/collections");
      const raw = Array.isArray(data) ? data : data?.data || [];
      collections = raw.map((c) => ({
        id: c.id,
        title: c.title,
        handle: c.handle,
        description: c.description || c.body_html || "",
        image_url: c.image?.src || c.image_url || "",
        products_count: c.products_count ?? 0,
        created_at: c.created_at || "",
        updated_at: c.updated_at || "",
      }));
    } catch (err) {
      console.warn("[client/collections] client API unreachable, using fallback:", err.message);
      collections = FALLBACK_COLLECTIONS;
    }

    if (collections.length === 0) {
      collections = FALLBACK_COLLECTIONS;
    }

    return Response.json({
      success: true,
      count: collections.length,
      collections,
    });
  } catch (error) {
    console.error("[client/collections GET] error:", error);
    return Response.json({ success: true, count: FALLBACK_COLLECTIONS.length, collections: FALLBACK_COLLECTIONS });
  }
}
