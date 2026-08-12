# Nakhye’s Ashok Sweets

A responsive React/TypeScript storefront for M/S Nakhye Foods LLP, designed around fresh Indian sweets, transparent quantity, gifting, cart, checkout, Razorpay and a role-gated store admin.

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
5. Never prefix Razorpay secrets or Supabase service-role keys with `VITE_`.

## Supabase

Create a Supabase project and run `supabase/schema.sql` in its SQL editor. Then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The schema includes roles, products, inventory, coupons, orders and order lines with row-level security. Product and coupon writes are admin-only. The client is initialized in `src/supabase.ts`; connect the React data layer to it before removing the current localStorage prototype.

## Razorpay

Set these server-only variables in Vercel:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Also set `VITE_RAZORPAY_KEY_ID` to the corresponding public Key ID. The included `/api/razorpay/order` endpoint creates orders and `/api/razorpay/verify` verifies the checkout signature. Add a Razorpay webhook endpoint and persist verified payments to Supabase before going live.

## Launch blockers

- Replace illustrative third-party product images with owned/licensed product photography.
- Confirm prices, ingredient/allergen data, shelf life, fulfilment areas and GST treatment.
- Insert verified GST/business details and the named grievance officer.
- Have the Terms, Privacy, Delivery and Refund text reviewed by the company’s advocate.
- Configure Supabase Auth, RLS, storage policies, order persistence and transactional inventory updates.
- Test payment success, failure, replay protection, refunds and webhook idempotency in Razorpay test mode.
