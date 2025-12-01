CREATE TABLE IF NOT EXISTS rental_unit_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
  inventory_unit_id UUID REFERENCES inventory_units(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  returned_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_rental_unit_assignments_rental_id ON rental_unit_assignments(rental_id);
CREATE INDEX idx_rental_unit_assignments_inventory_unit_id ON rental_unit_assignments(inventory_unit_id);
