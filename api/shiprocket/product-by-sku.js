import { shiprocketFetch } from "../shiprocket/auth.js";

/**
 * GET /api/shiprocket/product-by-sku?sku=AS-MK-001
 * Finds a product by its SKU
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku");
    const id = searchParams.get("id");

    if (!sku && !id) {
      return Response.json(
        {
          success: false,
          error: "Either 'sku' or 'id' query parameter is required",
        },
        { status: 400 }
      );
    }

    // Direct lookup by ID
    if (id) {
      const data = await shiprocketFetch(`/products/${id}`);
      const product = data?.data || data;

      return Response.json({
        success: true,
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description || "",
          price_inr: Math.round((product.selling_price || 0) / 100),
          stock: product.stock ?? 0,
          image_url: product.image_url || "",
          weight_g: product.weight || 500,
          category: product.category || "Sweets",
          is_active: product.status === "active",
        },
      });
    }

    // Search by SKU
    const data = await shiprocketFetch("/products", {
      query: { search: sku },
    });

    const matches = Array.isArray(data?.data) ? data.data : [];
    const exact = matches.find(
      (p) => p.sku?.toLowerCase() === sku.toLowerCase()
    );

    if (!exact) {
      return Response.json(
        {
          success: false,
          error: `No product found with SKU "${sku}"`,
          matches: matches.length,
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      product: {
        id: exact.id,
        sku: exact.sku,
        name: exact.name,
        description: exact.description || "",
        price_inr: Math.round((exact.selling_price || 0) / 100),
        stock: exact.stock ?? 0,
        image_url: exact.image_url || "",
        weight_g: exact.weight || 500,
        category: exact.category || "Sweets",
        is_active: exact.status === "active",
      },
    });
  } catch (error) {
    console.error("[shiprocket/product-by-sku] error:", error);
    return Response.json(
      {
        success: false,
        error:
          error?.message || "Failed to fetch product from Shiprocket",
      },
      { status: 502 }
    );
  }
}