import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import crypto from "node:crypto";

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

type DevEnv = Record<string, string>;

// Mirrors netlify/functions/_shiprocket-checkout.js so `npm run dev` exercises
// the same signing and the same error paths as production. Credentials are read
// from .env.local (or the shell); without them the dev route reports that
// plainly instead of pretending checkout works.
async function shiprocketCheckout(env: DevEnv, path: string, payload: unknown) {
  const key = env.SHIPROCKET_CHECKOUT_API_KEY || "";
  const secret = env.SHIPROCKET_CHECKOUT_API_SECRET || "";
  const base =
    env.SHIPROCKET_CHECKOUT_BASE_URL || "https://checkout-api.shiprocket.com";

  if (!key || !secret) {
    return { ok: false, status: 500, data: null as unknown };
  }

  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  const response = await fetch(base + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": key,
      "X-Api-HMAC-SHA256": signature,
    },
    body,
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: response.ok, status: response.status, data };
}

async function readJsonBody(req: { [Symbol.asyncIterator]?: unknown }) {
  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Buffer>) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
}

function apiPlugin(env: DevEnv) {
  return {
    name: "api-routes",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const u = new URL(req.url || "", `http://${req.headers.host}`);
        const pathname = u.pathname;

        if (
          !pathname.startsWith("/api/client/") &&
          !pathname.startsWith("/api/checkout/")
        ) {
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

          if (pathname === "/api/checkout/token" && req.method === "POST") {
            const body = await readJsonBody(req);
            const items = Array.isArray(body.items) ? body.items : [];

            if (items.length === 0) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: "Your cart is empty." }));
              return;
            }

            const result = await shiprocketCheckout(env, "/api/v1/access-token/checkout", {
              cart_data: {
                items: items.map((item: { variant_id: unknown; quantity: number }) => ({
                  variant_id: String(item.variant_id),
                  quantity: item.quantity,
                })),
                mobile_app: false,
              },
              redirect_url: body.redirect_url,
              timestamp: new Date().toISOString(),
            });

            const inner = (result.data as { result?: { token?: string; expires_at?: string; data?: { order_id?: string } } } | null)?.result;

            if (!result.ok || !inner?.token) {
              console.error("[dev api] checkout token failed:", result.status, JSON.stringify(result.data));
              res.statusCode = 502;
              res.end(JSON.stringify({
                success: false,
                error: "Checkout could not be started. Set SHIPROCKET_CHECKOUT_API_KEY and SHIPROCKET_CHECKOUT_API_SECRET, then check the dev server log.",
              }));
              return;
            }

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              token: inner.token,
              order_id: inner.data?.order_id,
              expires_at: inner.expires_at,
            }));
            return;
          }

          if (pathname === "/api/checkout/status" && req.method === "POST") {
            const body = await readJsonBody(req);
            const result = await shiprocketCheckout(env, "/api/v1/custom-platform-order/details", {
              order_id: String(body.order_id || ""),
              timestamp: new Date().toISOString(),
            });

            const order = (result.data as { result?: Record<string, unknown> } | null)?.result;

            if (!result.ok || !order) {
              console.error("[dev api] order status failed:", result.status, JSON.stringify(result.data));
              res.statusCode = 502;
              res.end(JSON.stringify({ success: false, error: "Could not look up this order." }));
              return;
            }

            // Same subset as netlify/functions/checkout-status.js — the full
            // response carries the shopper's address and phone, and dev must
            // not expose fields production withholds.
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              order: {
                order_id: order.order_id,
                status: order.status,
                payment_type: order.payment_type,
                payment_status: order.payment_status,
                total_amount_payable: order.total_amount_payable,
                coupon_codes: order.coupon_codes,
                coupon_discount: order.coupon_discount,
                edd: order.edd,
                order_created_date: order.order_created_date,
              },
            }));
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

export default defineConfig(({ mode }) => {
  // "" as the prefix loads every variable, not just VITE_ ones — the
  // Shiprocket credentials are deliberately unprefixed so they stay out of
  // the browser bundle.
  const env = loadEnv(mode, process.cwd(), "");
  return { plugins: [react(), apiPlugin(env)] };
});
