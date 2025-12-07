-- Paystack Escrow + Payout System Schema
-- Migration 004: Add payout settings, payout tracking, and seller balances

-- ============================================
-- SELLER BALANCE TRACKING
-- Add balance columns to sellers table
-- ============================================
ALTER TABLE sellers
ADD COLUMN IF NOT EXISTS pending_escrow_balance DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_paid_out DECIMAL(12, 2) DEFAULT 0;

-- ============================================
-- SELLER PAYOUT SETTINGS
-- Store Paystack transfer recipient details
-- ============================================
CREATE TABLE IF NOT EXISTS seller_payout_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  recipient_code TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'mpesa')),
  account_details JSONB NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id)
);

ALTER TABLE seller_payout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller_payout_settings_select_own" ON seller_payout_settings FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "seller_payout_settings_insert_own" ON seller_payout_settings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "seller_payout_settings_update_own" ON seller_payout_settings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "seller_payout_settings_delete_own" ON seller_payout_settings FOR DELETE USING (auth.uid() = seller_id);

-- ============================================
-- PAYOUTS TABLE
-- Track all payout transactions
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  escrow_hold_id UUID REFERENCES escrow_holds(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  transfer_code TEXT,
  transfer_reference TEXT UNIQUE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  paystack_response JSONB,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payouts_select_own" ON payouts FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "payouts_insert_service" ON payouts FOR INSERT WITH CHECK (true);
CREATE POLICY "payouts_update_service" ON payouts FOR UPDATE USING (true);

-- ============================================
-- UPDATE ESCROW HOLDS TABLE
-- Add payout tracking fields
-- ============================================
ALTER TABLE escrow_holds
ADD COLUMN IF NOT EXISTS transfer_reference TEXT,
ADD COLUMN IF NOT EXISTS transfer_code TEXT,
ADD COLUMN IF NOT EXISTS payout_initiated_at TIMESTAMPTZ;

-- ============================================
-- UPDATE TRANSACTIONS TABLE
-- Add Paystack-specific fields
-- ============================================
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS paystack_reference TEXT,
ADD COLUMN IF NOT EXISTS paystack_auth_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_seller_payout_settings_seller_id ON seller_payout_settings(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_transfer_reference ON payouts(transfer_reference);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_transfer_reference ON escrow_holds(transfer_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_paystack_reference ON transactions(paystack_reference);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER seller_payout_settings_updated_at 
  BEFORE UPDATE ON seller_payout_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payouts_updated_at 
  BEFORE UPDATE ON payouts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();
