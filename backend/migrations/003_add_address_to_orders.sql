ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS billing_address jsonb;
