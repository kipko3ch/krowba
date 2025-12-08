-- 006: Refund Tracking Schema
-- Migration to add refund tracking and delivery evidence storage

-- Add refund tracking fields to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refund_reference VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50); -- 'pending', 'processing', 'processed', 'failed', 'needs_attention'
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refund_logs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

-- Create refunds tracking table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  escrow_hold_id UUID REFERENCES escrow_holds(id),
  
  -- Paystack refund data
  paystack_refund_id INTEGER,
  refund_reference VARCHAR(255) UNIQUE,
  
  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, needs_attention, failed, processed
  
  -- Reason & logs
  reason TEXT,
  logs JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Create delivery evidence table
CREATE TABLE IF NOT EXISTS delivery_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  delivery_confirmation_id UUID REFERENCES delivery_confirmations(id),
  
  -- Evidence type
  evidence_type VARCHAR(50) NOT NULL, -- 'accept', 'reject', 'not_received'
  
  -- Description from buyer
  description TEXT,
  
  -- Photos/videos uploaded by buyer
  evidence_photos TEXT[] DEFAULT '{}',
  
  -- AI analysis (optional future enhancement)
  ai_analysis JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add simulated flag to payouts for test mode
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS
  simulated BOOLEAN DEFAULT FALSE;

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_refunds_transaction ON refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_reference ON refunds(refund_reference);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_delivery_evidence_transaction ON delivery_evidence(transaction_id);
CREATE INDEX IF NOT EXISTS idx_delivery_evidence_type ON delivery_evidence(evidence_type);

-- Add action_type to delivery_confirmations for tracking
ALTER TABLE delivery_confirmations ADD COLUMN IF NOT EXISTS action_type VARCHAR(50); -- 'accept', 'reject', 'not_received'
ALTER TABLE delivery_confirmations ADD COLUMN IF NOT EXISTS evidence_id UUID REFERENCES delivery_evidence(id);

-- Function to update refund logs
CREATE OR REPLACE FUNCTION append_refund_log(
  p_refund_id UUID,
  p_log_entry JSONB
)
RETURNS void AS $$
BEGIN
  UPDATE refunds
  SET 
    logs = logs || p_log_entry,
    updated_at = NOW()
  WHERE id = p_refund_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE refunds IS 'Tracks all refund requests and their status from Paystack';
COMMENT ON TABLE delivery_evidence IS 'Stores buyer evidence when rejecting or reporting delivery issues';
COMMENT ON COLUMN payouts.simulated IS 'TRUE if payout was simulated in test mode for non-NGN currencies';
