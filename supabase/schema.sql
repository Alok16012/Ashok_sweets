create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'admin');
create type public.order_status as enum ('pending', 'paid', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text not null,
  unit text not null default 'box',
  price_paise integer not null check (price_paise >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  available integer not null default 0 check (available >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= available),
  updated_at timestamptz not null default now()
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 80),
  minimum_paise integer not null default 0,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id),
  status public.order_status not null default 'pending',
  subtotal_paise integer not null check (subtotal_paise >= 0),
  discount_paise integer not null default 0 check (discount_paise >= 0),
  delivery_paise integer not null default 0 check (delivery_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  coupon_id uuid references public.coupons(id),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  delivery_name text not null,
  delivery_phone text not null,
  delivery_address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  unit_price_paise integer not null check (unit_price_paise >= 0),
  quantity integer not null check (quantity > 0)
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "active products are public" on public.products for select using (is_active or public.is_admin());
create policy "inventory is public" on public.inventory for select using (true);
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage inventory" on public.inventory for all using (public.is_admin()) with check (public.is_admin());
create policy "active coupons can be checked" on public.coupons for select using (is_active and starts_at <= now() and (expires_at is null or expires_at > now()) or public.is_admin());
create policy "admins manage coupons" on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy "customers read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "customers update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "customers read own orders" on public.orders for select using (customer_id = auth.uid() or public.is_admin());
create policy "admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "customers read own order items" on public.order_items for select using (exists(select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin())));

-- Reserve stock only from a trusted server/Edge Function after validating price and payment intent.
create or replace function public.reserve_inventory(p_product_id uuid, p_quantity integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
  update public.inventory
     set reserved = reserved + p_quantity, updated_at = now()
   where product_id = p_product_id and available - reserved >= p_quantity;
  if not found then raise exception 'Insufficient inventory'; end if;
end;
$$;
revoke all on function public.reserve_inventory(uuid, integer) from public, anon, authenticated;

