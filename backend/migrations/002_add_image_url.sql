-- Add image_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to product_variants table (optional, for variant-specific images)
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;
