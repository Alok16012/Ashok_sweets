// netlify/functions/products.js
// Returns product list in client API format
// TODO: Replace with actual fetch to client API
const PRODUCTS = [
  {
    id: 1,
    title: "Kesar Pista Festive Box",
    body_html: "<p>Premium kesar and pista dryfruit box. 12 handcrafted pieces.</p>",
    vendor: "Nakhye's Ashok Sweets",
    product_type: "Premium Mithai",
    created_at: "2024-01-15T10:00:00+05:30",
    handle: "kesar-pista-festive-box",
    tags: "premium, festive, dryfruit",
    status: "active",
    variants: [
      {
        id: 101,
        title: "500g",
        price: "680.00",
        compare_at_price: "850.00",
        sku: "AS-KP-001",
        quantity: 80,
        grams: 500,
        weight: 1.1,
        weight_unit: "lb",
        image: {
          src: "https://static.wixstatic.com/media/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg/v1/fill/w_980,h_1307,al_c,q_85/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg"
        },
        option_values: { "Size": "500g" }
      }
    ],
    image: { src: "https://static.wixstatic.com/media/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg/v1/fill/w_980,h_1307,al_c,q_85/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg" },
    options: [{ name: "Size", values: ["250g", "500g", "1kg"] }]
  },
  {
    id: 2,
    title: "Wedding Favour Mithai Boxes",
    body_html: "<p>Nine-piece boxes with rose and pistachio. Perfect for wedding gifts.</p>",
    vendor: "Nakhye's Ashok Sweets",
    product_type: "Wedding Orders",
    created_at: "2024-02-01T08:30:00+05:30",
    handle: "wedding-favour-mithai-boxes",
    tags: "wedding, gift, premium",
    status: "active",
    variants: [
      {
        id: 201,
        title: "9 pcs",
        price: "450.00",
        sku: "AS-WM-002",
        quantity: 42,
        grams: 450,
        weight: 1.0,
        weight_unit: "lb",
        image: {
          src: "https://weddingsutra.com/images/Vendor_Images/Wedding-Favors-%26-Gifts/meetha-by-radisson/meetha-by-radisson-03.jpg"
        },
        option_values: { "Size": "9 pcs" }
      }
    ],
    image: { src: "https://weddingsutra.com/images/Vendor_Images/Wedding-Favors-%26-Gifts/meetha-by-radisson/meetha-by-radisson-03.jpg" },
    options: [{ name: "Size", values: ["6 pcs", "9 pcs", "12 pcs"] }]
  },
  {
    id: 3,
    title: "Motichoor Laddoo - Desi Ghee",
    body_html: "<p>Six pieces of pure desi ghee motichoor laddoo. No preservatives.</p>",
    vendor: "Nakhye's Ashok Sweets",
    product_type: "Traditional Favourites",
    created_at: "2024-01-20T14:00:00+05:30",
    handle: "motichoor-laddoo-desi-ghee",
    tags: "traditional, laddoo, desi ghee",
    status: "active",
    variants: [
      {
        id: 301,
        title: "6 pcs",
        price: "520.00",
        sku: "AS-ML-003",
        quantity: 48,
        grams: 350,
        weight: 0.77,
        weight_unit: "lb",
        image: {
          src: "https://media.pri.org/s3fs-public/story/images/Mithai.JPG"
        },
        option_values: { "Size": "6 pcs" }
      }
    ],
    image: { src: "https://media.pri.org/s3fs-public/story/images/Mithai.JPG" },
    options: [{ name: "Size", values: ["3 pcs", "6 pcs", "12 pcs"] }]
  },
  {
    id: 4,
    title: "Gulab Jamun - Milk Solid",
    body_html: "<p>Soft gulab jamun made from pure milk solids. Pack of 10.</p>",
    vendor: "Nakhye's Ashok Sweets",
    product_type: "Traditional Favourites",
    created_at: "2024-03-01T11:00:00+05:30",
    handle: "gulab-jamun-milk-solid",
    tags: "gulab jamun, traditional",
    status: "active",
    variants: [
      {
        id: 401,
        title: "10 pcs",
        price: "350.00",
        sku: "AS-GJ-004",
        quantity: 60,
        grams: 400,
        weight: 0.88,
        weight_unit: "lb",
        option_values: { "Size": "10 pcs" }
      }
    ],
    image: { src: "https://media.pri.org/s3fs-public/story/images/Mithai.JPG" },
    options: [{ name: "Size", values: ["5 pcs", "10 pcs", "20 pcs"] }]
  },
  {
    id: 5,
    title: "Rasgulla - Bengal Special",
    body_html: "<p>Authentic Bengali rasgulla. Soft and spongy. Pack of 12.</p>",
    vendor: "Nakhye's Ashok Sweets",
    product_type: "Bengali Sweets",
    created_at: "2024-03-10T09:00:00+05:30",
    handle: "rasgulla-bengal-special",
    tags: "rasgulla, bengali",
    status: "active",
    variants: [
      {
        id: 501,
        title: "12 pcs",
        price: "380.00",
        sku: "AS-RS-005",
        quantity: 55,
        grams: 500,
        weight: 1.1,
        weight_unit: "lb",
        option_values: { "Size": "12 pcs" }
      }
    ],
    image: { src: "https://media.pri.org/s3fs-public/story/images/Mithai.JPG" },
    options: [{ name: "Size", values: ["6 pcs", "12 pcs", "24 pcs"] }]
  },
  {
    id: 6,
    title: "Kaju Katli - Silver Foil",
    body_html: "<p>Premium kaju katli wrapped in silver foil. 500g box.</p>",
    vendor: "Nakhye's Ashok Sweets",
    product_type: "Premium Mithai",
    created_at: "2024-02-15T13:00:00+05:30",
    handle: "kaju-katli-silver-foil",
    tags: "kaju katli, premium",
    status: "active",
    variants: [
      {
        id: 601,
        title: "500g",
        price: "750.00",
        sku: "AS-KK-006",
        quantity: 30,
        grams: 500,
        weight: 1.1,
        weight_unit: "lb",
        option_values: { "Size": "500g" }
      }
    ],
    image: { src: "https://static.wixstatic.com/media/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg/v1/fill/w_980,h_1307,al_c,q_85/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg" },
    options: [{ name: "Size", values: ["250g", "500g", "1kg"] }]
  }
];

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // Parse query params
    const url = new URL(event.rawUrl || `https://dummy${event.path}`);
    const collectionId = url.searchParams.get("collection_id");
    const handle = url.searchParams.get("handle");
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const page = parseInt(url.searchParams.get("page") || "1", 10);

    let filtered = [...PRODUCTS];

    // Filter by handle or collection_id if provided
    // For demo: handle matches product_type
    if (handle) {
      filtered = filtered.filter(p => p.product_type?.toLowerCase().includes(handle.toLowerCase()));
    }
    if (collectionId) {
      filtered = filtered.filter(p => p.id === parseInt(collectionId, 10));
    }

    // Pagination
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: {
          total: paginated.length,
          products: paginated
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
