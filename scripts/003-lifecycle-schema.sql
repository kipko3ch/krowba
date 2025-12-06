-- Add buyer details and lifecycle columns to krowba_links table

ALTER TABLE krowba_links
ADD COLUMN IF NOT EXISTS buyer_name TEXT,
ADD COLUMN IF NOT EXISTS buyer_email TEXT,
ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered', 'rejected')),
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Create an index on shipping_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_krowba_links_shipping_status ON krowba_links(shipping_status);
