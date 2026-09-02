import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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

function apiPlugin() {
  return {
    name: "api-routes",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const u = new URL(req.url || "", `http://${req.headers.host}`);
        const pathname = u.pathname;

        if (!pathname.startsWith("/api/client/")) {
          return next();
        }

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (pathname === "/api/client/products" && req.method === "GET") {
            const collectionHandle = u.searchParams.get("collection_handle");
            const limit = parseInt(u.searchParams.get("limit") || "50");
            const page = parseInt(u.searchParams.get("page") || "1");

            let products = [...FALLBACK_PRODUCTS];
            if (collectionHandle) {
              const q = collectionHandle.replace(/-/g, " ").toLowerCase();
              products = products.filter(p =>
                p.handle === collectionHandle ||
                p.product_type?.toLowerCase().includes(q)
              );
            }

            const start = (page - 1) * limit;
            const paged = products.slice(start, start + limit);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, count: paged.length, products: paged }));
            return;
          }

          if (pathname === "/api/client/collections" && req.method === "GET") {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, count: FALLBACK_COLLECTIONS.length, collections: FALLBACK_COLLECTIONS }));
            return;
          }

          if (pathname.startsWith("/api/client/collection-products/") && req.method === "GET") {
            const handleOrId = pathname.split("/").pop();
            const q = (handleOrId || "").replace(/-/g, " ").toLowerCase();
            const products = FALLBACK_PRODUCTS.filter(p =>
              p.handle === handleOrId ||
              p.product_type?.toLowerCase().includes(q)
            );
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, collection: handleOrId, count: products.length, products }));
            return;
          }

          if (pathname === "/api/client/orders" && req.method === "POST") {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
            const orderId = "65a" + Math.random().toString(36).slice(2, 18);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, order_id: orderId, timestamp: new Date().toISOString(), redirect_url: body?.cart_data?.custom_attributes?.redirect_url || "http://localhost:3004/order-success" }));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: "Not found", path: pathname, method: req.method }));
        } catch (err) {
          console.error("[api-route] error:", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
});
