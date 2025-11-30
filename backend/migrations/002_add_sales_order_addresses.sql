-- Align sales_orders schema with route usage by adding address fields
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS billing_address text;