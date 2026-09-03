# Nakhye’s Ashok Sweets

A responsive React/TypeScript storefront for M/S Nakhye Foods LLP, designed around fresh Indian sweets, transparent quantity, gifting, cart, Shiprocket Checkout and a role-gated store admin.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The production build is created with `npm run build`.

## Preview administrator access

The current UI gate uses `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD`. If neither is set, the design-preview fallback is `admin@ashoksweets.com` / `Ashok@2026`. This is not production security: browser environment values are public. Before taking orders, replace the gate with Supabase Auth and check the `profiles.role = 'admin'` claim/server-side role for every product, inventory and coupon mutation.

## GitHub and Vercel

1. Create a new GitHub repository and push this folder.
2. Import that repository into Vercel; framework preset: **Vite**.
3. Build command: `npm run build`; output directory: `dist`.
4. Add the environment variables from `.env.example` in Vercel Project Settings.
5. Never prefix the Shiprocket Checkout secret or Supabase service-role keys with `VITE_`.

## Supabase

Create a Supabase project and run `supabase/schema.sql` in its SQL editor. Then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The schema includes roles, products, inventory, coupons, orders and order lines with row-level security. Product and coupon writes are admin-only. The client is initialized in `src/supabase.ts`; connect the React data layer to it before removing the current localStorage prototype.

## Shiprocket Checkout

Payment and delivery details are collected by Shiprocket Checkout, not by this app. Set these server-only variables in the hosting dashboard:

- `SHIPROCKET_CHECKOUT_API_KEY`
- `SHIPROCKET_CHECKOUT_API_SECRET`

Never give either one a `VITE_` prefix — that would compile the secret into the public browser bundle.

Flow:

1. The shopper presses Checkout. The browser posts the cart to `/api/checkout/token`.
2. `netlify/functions/checkout-token.js` signs the request (`X-Api-HMAC-SHA256` = base64 HMAC-SHA256 of the raw body, keyed with the API secret) and returns a checkout token.
3. The page calls `HeadlessCheckout.addToCart(event, token, { fallbackUrl })`. The SDK is loaded in `index.html`. Shiprocket then collects address, coupon code and payment.
4. Shiprocket redirects back to `/order-success?oid=<order id>&ost=<SUCCESS|FAILED>`.
5. The confirmation page calls `/api/checkout/status`, which re-reads the order from Shiprocket. The `ost` parameter alone is never treated as proof of payment — it comes from the URL bar and can be edited.

Local development uses the same signing path through the dev middleware in `vite.config.ts`, so export the two variables before `npm run dev`.

### Catalog sync is a prerequisite

`variant_id` values sent at checkout must exist in the catalogue Shiprocket has synced from `/api/client/products`. The access-token call succeeds for *any* numeric id, but an unsynced variant then fails inside Shiprocket's checkout screen as a bare "Something went wrong…". Confirm the catalogue is synced and that the seller domain is registered before testing.

### Order webhook still to do

Shiprocket posts paid orders to a registered webhook URL. Until that endpoint exists and writes to Supabase, orders live only in the Shiprocket dashboard.

## Launch blockers

- Replace illustrative third-party product images with owned/licensed product photography.
- Confirm prices, ingredient/allergen data, shelf life, fulfilment areas and GST treatment.
- Insert verified GST/business details and the named grievance officer.
- Have the Terms, Privacy, Delivery and Refund text reviewed by the company’s advocate.
- Configure Supabase Auth, RLS, storage policies, order persistence and transactional inventory updates.
- Test payment success, failure, replay protection, refunds and webhook idempotency in Shiprocket Checkout.
