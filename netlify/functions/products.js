// netlify/functions/products.js
// Fetches products from client API with fallback mock data

const CLIENT_API_BASE = process.env.CLIENT_API_BASE_URL || "https://api.example.com/api/v1";
const CLIENT_API_KEY = process.env.CLIENT_API_KEY || "";

const FALLBACK_PRODUCTS = [
  {
    id: 632910392,
    title: "Kesar Pista Festive Box",
    body_html: "<p>Premium kesar pista mithai box, 12 handcrafted pieces</p>",
    vendor: "Nakhye's Ashok Sweets",
    product_type: "Premium Mithai",
    created_at: "2023-11-07T09:50:12-05:00",
    handle: "kesar-pista-festive-box",
    tags: "Festive, Premium, Dry Fruit",
    status: "active",
    variants: [
      {
        id: 808950810,
        title: "Regular",
        price: "680.00",
        compare_at_price: "850.00",
        sku: "AS-KP-001",
        quantity: 80,
        grams: 1200,
        weight: 1.25,
        weight_unit: "kg",
        option_values: { Size: "Regular" },
        image: { src: "https://static.wixstatic.com/media/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg/v1/fill/w_980,h_1307,al_c,q_85/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg" }
      }
    ],
    image: { src: "https://static.wixstatic.com/media/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg/v1/fill/w_980,h_1307,al_c,q_85/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg" },
    options: [{ name: "Size", values: ["Regular", "Large"] }]
  },
  {
    id: 632910393,
    title: "Wedding Favour Mithai Boxes",
    body_html: "<p>Nine-piece wedding favour boxes with rose and pistachio</p>",
    vendor: "Nakhye's Ashok Sweets",
    product_type: "Wedding Orders",
    created_at: "2023-10-15T08:20:00-05:00",
    handle: "wedding-favour-mithai-boxes",
    tags: "Wedding, Bulk, Gifting",
    status: "active",
    variants: [
      {
        id: 808950811,
        title: "9 Piece Box",
        price: "450.00",
        sku: "AS-WM-002",
        quantity: 42,
        grams: 900,
        weight: 0.9,
        weight_unit: "kg",
        option_values: { Pieces: "9" },
        image: { src: "https://weddingsutra.com/images/Vendor_Images/Wedding-Favors-%26-Gifts/meetha-by-radisson/meetha-by-radisson-03.jpg" }
      }
    ],
    image: { src: "https://weddingsutra.com/images/Vendor_Images/Wedding-Favors-%26-Gifts/meetha-by-radisson/meetha-by-radisson-03.jpg" },
    options: [{ name: "Pieces", values: ["9", "12", "16"] }]
  },
  {
    id: 632910394,
    title: "Motichoor Laddoo - Desi Ghee",
    body_html: "<p>Six pieces of pure desi ghee motichoor laddoo, no preservatives</p>",
    vendor: "Nakhye's Ashok Sweets",
    product_type: "Traditional Favourites",
    created_at: "2023-09-20T11:30:00-05:00",
    handle: "motichoor-laddoo-desi-ghee",
    tags: "Traditional, Premium, Laddoo",
    status: "active",
    variants: [
      {
        id: 808950812,
        title: "6 Pieces",
        price: "520.00",
        sku: "AS-ML-003",
        quantity: 48,
        grams: 600,
        weight: 0.6,
        weight_unit: "kg",
        option_values: { Pack: "6 pcs" },
        image: { src: "https://media.pri.org/s3fs-public/story/images/Mithai.JPG" }
      }
    ],
    image: { src: "https://media.pri.org/s3fs-public/story/images/Mithai.JPG" },
    options: [{ name: "Pack", values: ["6 pcs", "12 pcs"] }]
  }
];

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const qs = event.queryStringParameters || {};
    const limit = parseInt(qs.limit || "50");
    const page = parseInt(qs.page || "1");

    // Try client API first
    let products = [];
    try {
      let url = `${CLIENT_API_BASE}/products?limit=${limit}&page=${page}`;
      if (qs.handle) url += `&handle=${encodeURIComponent(qs.handle)}`;
      if (qs.collection_id) url += `&collection_id=${qs.collection_id}`;

      const apiRes = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": CLIENT_API_KEY
        }
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        products = data?.data?.products || data?.products || [];
      }
    } catch (err) {
      console.warn("[products] Client API unreachable, using fallback:", err.message);
    }

    // Use fallback if no products from API
    if (products.length === 0) {
      products = [...FALLBACK_PRODUCTS];
      if (qs.handle) {
        const q = qs.handle.replace(/-/g, " ").toLowerCase();
        products = products.filter(p =>
          p.handle === qs.handle ||
          p.product_type?.toLowerCase().includes(q)
        );
      }
    }

    const start = (page - 1) * limit;
    const paged = products.slice(start, start + limit);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: paged.length,
        data: {
          total: products.length,
          products: paged
        }
      })
    };
  } catch (error) {
    console.error("[products] error:", error);
    // Return fallback data even on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: FALLBACK_PRODUCTS.length,
        data: {
          total: FALLBACK_PRODUCTS.length,
          products: FALLBACK_PRODUCTS
        }
      })
    };
  }
};
