import { shiprocketFetch } from "../shiprocket/auth.js";

/**
 * GET /api/shiprocket/collections
 * Returns all collections from Shiprocket
 */
export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = await shiprocketFetch("/collection");

    // Shiprocket response: { data: [{ id, name, description, ... }] }
    const collections = Array.isArray(data?.data)
      ? data.data.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || "",
          products_count: c.products_count ?? c.productCount ?? 0,
        }))
      : [];

    return response.status(200).json({
      success: true,
      count: collections.length,
      collections,
    });
  } catch (error) {
    console.error("[shiprocket/collections] error:", error);
    return response.status(502).json({
      success: false,
      error: error?.message || "Failed to fetch collections from Shiprocket",
    });
  }
}
