-- Add shipping proof columns to krowba_links table

ALTER TABLE krowba_links
ADD COLUMN IF NOT EXISTS shipping_proof_url TEXT,
ADD COLUMN IF NOT EXISTS shipping_courier TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS shipping_notes TEXT;
