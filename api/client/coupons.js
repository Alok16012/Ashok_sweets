/**
 * GET /api/client/coupons
 *   - List all coupons (admin) when ?all=true
 *   - Otherwise validates a single code: ?code=XYZ
 *
 * POST /api/client/coupons (admin)
 *   - Body: { code, discount_percent, active, min_subtotal, expires_at }
 *   - Creates or updates a coupon
 *
 * PUT /api/client/coupons (admin)
 *   - Body: { code, active } - toggles a coupon's active flag
 *
 * DELETE /api/client/coupons?code=XYZ (admin)
 *   - Removes a coupon
 *
 * Storage: a JSON file on disk under .data/coupons.json
 * This makes coupons available to checkout and admin panel across sessions.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "coupons.json");

// Default seed coupons that always exist and cannot be deleted via API
const SEED_COUPONS = [
  { code: "ASHOK10", discount_percent: 10, active: true, min_subtotal: 0, expires_at: null, description: "Welcome 10% off" },
  { code: "FESTIVE15", discount_percent: 15, active: true, min_subtotal: 999, expires_at: null, description: "Festive season 15% off on orders ≥ ₹999" },
  { code: "TESTA", discount_percent: 10, active: true, min_subtotal: 0, expires_at: null, description: "Test 10% off" },
];

async function ensureFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ coupons: [] }, null, 2), "utf8");
  }
}

async function readAll() {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.coupons) ? parsed.coupons : [];
  } catch {
    return [];
  }
}

async function writeAll(coupons) {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify({ coupons }, null, 2), "utf8");
}

function mergeWithSeeds(custom) {
  const map = new Map();
  for (const c of SEED_COUPONS) map.set(c.code, c);
  for (const c of custom) map.set(c.code, { ...map.get(c.code), ...c, code: c.code.toUpperCase() });
  return Array.from(map.values());
}

function isExpired(c) {
  if (!c.expires_at) return false;
  return new Date(c.expires_at).getTime() < Date.now();
}

function isUsable(c, subtotal = 0) {
  return (
    c.active &&
    !isExpired(c) &&
    (c.min_subtotal || 0) <= subtotal
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const subtotalParam = searchParams.get("subtotal");
    const showAll = searchParams.get("all") === "true";
    const subtotal = subtotalParam ? Number(subtotalParam) : 0;

    const custom = await readAll();
    const all = mergeWithSeeds(custom);

    // Validate a single code
    if (code) {
      const upper = code.trim().toUpperCase();
      const coupon = all.find((c) => c.code === upper);
      if (!coupon) {
        return Response.json(
          { success: false, valid: false, error: `Coupon "${upper}" not found` },
          { status: 404 }
        );
      }
      if (!coupon.active) {
        return Response.json(
          { success: false, valid: false, error: "This coupon is inactive." },
          { status: 400 }
        );
      }
      if (isExpired(coupon)) {
        return Response.json(
          { success: false, valid: false, error: "This coupon has expired." },
          { status: 400 }
        );
      }
      if ((coupon.min_subtotal || 0) > subtotal) {
        return Response.json(
          {
            success: false,
            valid: false,
            error: `Add ₹${(coupon.min_subtotal - subtotal).toLocaleString()} more to use this coupon.`,
          },
          { status: 400 }
        );
      }

      const discount = Math.round((subtotal * coupon.discount_percent) / 100);
      return Response.json({
        success: true,
        valid: true,
        coupon: {
          code: coupon.code,
          discount_percent: coupon.discount_percent,
          min_subtotal: coupon.min_subtotal || 0,
          expires_at: coupon.expires_at,
          description: coupon.description,
        },
        discount_amount: discount,
      });
    }

    if (showAll) {
      return Response.json({ success: true, coupons: all });
    }

    // Public list: only currently usable coupons
    return Response.json({
      success: true,
      coupons: all.filter((c) => isUsable(c, 0)),
    });
  } catch (error) {
    console.error("[client/coupons GET] error:", error);
    return Response.json(
      { success: false, error: error?.message || "Failed to load coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) {
      return Response.json(
        { success: false, error: "code is required" },
        { status: 400 }
      );
    }
    const discount = Number(body.discount_percent);
    if (!Number.isFinite(discount) || discount <= 0 || discount > 80) {
      return Response.json(
        { success: false, error: "discount_percent must be between 1 and 80" },
        { status: 400 }
      );
    }

    const newCoupon = {
      code,
      discount_percent: discount,
      active: body.active !== false,
      min_subtotal: Number(body.min_subtotal) || 0,
      expires_at: body.expires_at || null,
      description: body.description || "",
      created_at: new Date().toISOString(),
    };

    const custom = await readAll();
    const idx = custom.findIndex((c) => c.code === code);
    if (idx >= 0) custom[idx] = { ...custom[idx], ...newCoupon, code };
    else custom.unshift(newCoupon);
    await writeAll(custom);

    return Response.json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error("[client/coupons POST] error:", error);
    return Response.json(
      { success: false, error: error?.message || "Failed to save coupon" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) {
      return Response.json(
        { success: false, error: "code is required" },
        { status: 400 }
      );
    }

    const custom = await readAll();
    const idx = custom.findIndex((c) => c.code === code);
    if (idx < 0) {
      // Toggle a seed coupon by creating/overriding entry
      const seedIdx = SEED_COUPONS.findIndex((c) => c.code === code);
      if (seedIdx < 0) {
        return Response.json(
          { success: false, error: `Coupon "${code}" not found` },
          { status: 404 }
        );
      }
      const updated = {
        ...SEED_COUPONS[seedIdx],
        active: body.active !== false,
      };
      custom.unshift(updated);
      await writeAll(custom);
      return Response.json({ success: true, coupon: updated });
    }

    custom[idx] = {
      ...custom[idx],
      active: body.active !== undefined ? body.active !== false : custom[idx].active,
    };
    await writeAll(custom);
    return Response.json({ success: true, coupon: custom[idx] });
  } catch (error) {
    console.error("[client/coupons PUT] error:", error);
    return Response.json(
      { success: false, error: error?.message || "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = String(searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return Response.json(
        { success: false, error: "code is required" },
        { status: 400 }
      );
    }
    if (SEED_COUPONS.some((c) => c.code === code)) {
      return Response.json(
        { success: false, error: "Seed coupons cannot be deleted" },
        { status: 400 }
      );
    }
    const custom = await readAll();
    const next = custom.filter((c) => c.code !== code);
    await writeAll(next);
    return Response.json({ success: true, removed: code });
  } catch (error) {
    console.error("[client/coupons DELETE] error:", error);
    return Response.json(
      { success: false, error: error?.message || "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
