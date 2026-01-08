-- Add contact fields to Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email TEXT;

-- Add contact fields to Units
ALTER TABLE units ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS phone TEXT;
