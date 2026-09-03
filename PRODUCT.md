# Nakhye’s Ashok Sweets — product foundation

## Customer promise

See what is fresh, know what it costs, choose how much you need and complete the order without ambiguity. The core customer loop is discover → inspect product and availability → choose quantity → cart or buy now → secure payment → fulfilment.

## Primary journeys

1. A customer discovers hot-selling sweets or searches the full catalogue, chooses a quantity and checks out.
2. A gifting customer explores occasion-led boxes, submits a bulk enquiry or purchases a standard box.
3. An authorised store administrator signs in, adds or removes products, manages availability and generates event coupons.
4. The business tracks paid orders through preparation, pickup/delivery and completion.

## Information architecture

Customer: Discover, All Sweets, Product Detail, Cart, Billing & Payment, Activity, Policies and Support. Administration: private login, Products, Inventory, Coupons and Orders. Store controls never appear in the ordinary customer journey.

## Visual system

Ashok red is the action and identity colour; silver-mineral neutrals create restraint; saffron-gold signals craft and celebration. The submitted red logo artwork dissolves into a red header field so its rectangular outer edge is not perceived as a pasted white tile. Typography combines DM Serif Display for appetising editorial headlines with Inter for highly legible commerce information.

## Production architecture

Vite/React/TypeScript frontend on Vercel; Supabase Postgres/Auth/Storage with RLS; Shiprocket Checkout for payment and delivery capture, with HMAC-signed token creation in serverless functions. Inventory reservation must be executed in a trusted database function or server transaction, never by updating a browser-visible number.
