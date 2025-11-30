CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer', -- customer, staff, operator, admin
  name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  label text,
  line1 text,
  line2 text,
  city text,
  region text,
  postal_code text,
  country text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku text UNIQUE,
  title text NOT NULL,
  description text,
  category text, -- indoor/outdoor/stage/transparent
  base_price numeric(12,2) NOT NULL,
  for_rent boolean DEFAULT false,
  for_sale boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text,
  pixel_pitch numeric, -- e.g., 3.9
  width_cm numeric,
  height_cm numeric,
  weight_kg numeric,
  price numeric(12,2),
  rent_price_per_day numeric(12,2),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text, -- image/video/pdf
  order_index int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory_units (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  serial_number text,
  status text NOT NULL DEFAULT 'available', -- available, reserved, rented, maintenance
  location text,
  created_at timestamptz DEFAULT now()
);

-- Quotes (customer requests)
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  contact_email text,
  contact_phone text,
  event_date date,
  status text DEFAULT 'new', -- new, sent, accepted, declined
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id),
  quantity int,
  price numeric(12,2)
);

-- Rentals / Bookings
CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text DEFAULT 'pending', -- pending, confirmed, ongoing, completed, cancelled
  start_date date,
  end_date date,
  total_amount numeric(12,2),
  deposit_amount numeric(12,2),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rental_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id uuid REFERENCES rentals(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id),
  quantity int,
  unit_rent_price numeric(12,2)
);

-- Sales orders
CREATE TABLE IF NOT EXISTS sales_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text DEFAULT 'pending', -- pending, paid, shipped, complete, refunded
  total_amount numeric(12,2),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES sales_orders(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id),
  quantity int,
  unit_price numeric(12,2)
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES sales_orders(id) ON DELETE SET NULL,
  rental_id uuid REFERENCES rentals(id) ON DELETE SET NULL,
  provider text,
  provider_payment_id text,
  amount numeric(12,2),
  currency text DEFAULT 'USD',
  status text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_units_variant_status ON inventory_units (variant_id, status);
