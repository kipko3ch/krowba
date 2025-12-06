-- Paystack Migration Script
-- Run this in Supabase SQL Editor

-- Add Paystack columns to transactions table
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS paystack_reference TEXT,
  ADD COLUMN IF NOT EXISTS paystack_auth_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT;

-- Rename payhero_reference for backwards compatibility (optional)
-- ALTER TABLE transactions RENAME COLUMN payhero_reference TO legacy_payhero_reference;

-- Add transfer tracking to escrow_holds
ALTER TABLE escrow_holds
  ADD COLUMN IF NOT EXISTS transfer_reference TEXT,
  ADD COLUMN IF NOT EXISTS transfer_code TEXT;

-- Create seller_bank_accounts table for payouts
CREATE TABLE IF NOT EXISTS seller_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  paystack_recipient_code TEXT,
  is_default BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE seller_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "seller_bank_accounts_select_own" ON seller_bank_accounts 
  FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "seller_bank_accounts_insert_own" ON seller_bank_accounts 
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "seller_bank_accounts_update_own" ON seller_bank_accounts 
  FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "seller_bank_accounts_delete_own" ON seller_bank_accounts 
  FOR DELETE USING (auth.uid() = seller_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_paystack_reference ON transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_transfer_reference ON escrow_holds(transfer_reference);
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_seller_id ON seller_bank_accounts(seller_id);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER seller_bank_accounts_updated_at 
  BEFORE UPDATE ON seller_bank_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
