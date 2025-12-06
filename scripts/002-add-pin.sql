-- Add access_pin column to krowba_links table
ALTER TABLE krowba_links ADD COLUMN IF NOT EXISTS access_pin TEXT;
