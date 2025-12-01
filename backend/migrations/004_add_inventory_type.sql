-- Add inventory_type column to inventory_units table
ALTER TABLE inventory_units 
ADD COLUMN IF NOT EXISTS inventory_type VARCHAR(10) NOT NULL DEFAULT 'rental' 
CHECK (inventory_type IN ('rental', 'sale'));

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory_units(inventory_type);

-- Update existing records to default to 'rental'
UPDATE inventory_units SET inventory_type = 'rental' WHERE inventory_type IS NULL;
