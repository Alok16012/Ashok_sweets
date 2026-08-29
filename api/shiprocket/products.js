import { shiprocketFetch } from "../shiprocket/auth.js";

/**
 * Shiprocket product mapper
 * Maps our internal product format to Shiprocket format
 */
function mapToShiprocket(product) {
  return {
    name: product.name,
    description: product.description || "",
    sku: product.sku,
    // Shiprocket expects weight in grams
    weight: product.weight_g || 500,
    // Dimensions in cm
    length: product.length_cm || 20,
    breadth: product.breadth_cm || 15,
    height: product.height_cm || 10,
    // Selling price in INR (paise)
    selling_price: Math.round((product.price_inr || product.price || 0) * 100),
    // Stock
    stock: product.stock ?? product.available ?? 0,
    // Category (optional - maps to Shiprocket category if configured)
    category: product.category || "Sweets",
    // HSN code (optional but useful for GST)
    hsn_code: product.hsn_code || "17049000",
    // Image URL
    image_url: product.image_url || product.image || "",
    // Active status
    status: product.is_active !== false ? "active" : "inactive",
  };
}

/**
 * Maps Shiprocket product back to our format
 */
function mapFromShiprocket(srProduct) {
  return {
    id: srProduct.id,
    name: srProduct.name,
    description: srProduct.description || "",
    sku: srProduct.sku,
    weight_g: srProduct.weight || 500,
    length_cm: srProduct.length || 20,
    breadth_cm: srProduct.breadth || 15,
    height_cm: srProduct.height || 10,
    price_inr: Math.round((srProduct.selling_price || 0) / 100),
    stock: srProduct.stock ?? 0,
    category: srProduct.category || "Sweets",
    hsn_code: srProduct.hsn_code || "17049000",
    image_url: srProduct.image_url || "",
    is_active: srProduct.status === "active",
    shiprocket_id: srProduct.id,
  };
}

/**
 * GET /api/shiprocket/products
 * Query params:
 *   - collection_id: Filter products by collection
 *   - page: Page number (default 1)
 *   - per_page: Items per page (default 100)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collection_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("per_page") || "100", 10);

    // If collection_id is provided, fetch products from that collection
    if (collectionId) {
      const data = await shiprocketFetch(
        `/collection/${collectionId}/products`,
        { query: { page, per_page: perPage } }
      );

      const products = Array.isArray(data?.data)
        ? data.data.map(mapFromShiprocket)
        : [];

      return Response.json({
        success: true,
        count: products.length,
        collection_id: collectionId,
        products,
      });
    }

    // Otherwise, list all products
    const data = await shiprocketFetch("/products", {
      query: { page, per_page: perPage },
    });

    const products = Array.isArray(data?.data)
      ? data.data.map(mapFromShiprocket)
      : [];

    return Response.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("[shiprocket/products GET] error:", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Failed to fetch products from Shiprocket",
      },
      { status: 502 }
    );
  }
}

/**
 * POST /api/shiprocket/products
 * Body: { name, sku, price_inr, ... }
 * Creates a new product in Shiprocket
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.sku) {
      return Response.json(
        { success: false, error: "name and sku are required" },
        { status: 400 }
      );
    }

    // Check for duplicate SKU
    if (body.sku) {
      const existing = await shiprocketFetch("/products", {
        query: { search: body.sku },
      });

      const duplicates = Array.isArray(existing?.data)
        ? existing.data.filter((p) => p.sku === body.sku)
        : [];

      if (duplicates.length > 0) {
        return Response.json(
          {
            success: false,
            error: `Product with SKU "${body.sku}" already exists in Shiprocket`,
            existing_product: mapFromShiprocket(duplicates[0]),
          },
          { status: 409 }
        );
      }
    }

    const shiprocketProduct = mapToShiprocket(body);

    const data = await shiprocketFetch("/products", {
      method: "POST",
      body: shiprocketProduct,
    });

    const created = mapFromShiprocket(data?.data || data);

    return Response.json({
      success: true,
      message: "Product created in Shiprocket",
      product: created,
    });
  } catch (error) {
    console.error("[shiprocket/products POST] error:", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Failed to create product in Shiprocket",
      },
      { status: 502 }
    );
  }
}

/**
 * PUT /api/shiprocket/products
 * Body: { id, ...fields }
 * Updates an existing product in Shiprocket
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const productId = body.id;

    if (!productId) {
      return Response.json(
        { success: false, error: "product id is required" },
        { status: 400 }
      );
    }

    const { id, ...updates } = body;
    const shiprocketUpdates = mapToShiprocket(updates);

    const data = await shiprocketFetch(`/products/${productId}`, {
      method: "PUT",
      body: shiprocketUpdates,
    });

    const updated = mapFromShiprocket(data?.data || data);

    return Response.json({
      success: true,
      message: "Product updated in Shiprocket",
      product: updated,
    });
  } catch (error) {
    console.error("[shiprocket/products PUT] error:", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Failed to update product in Shiprocket",
      },
      { status: 502 }
    );
  }
}
