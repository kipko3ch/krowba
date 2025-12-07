-- Database Helper Functions for Escrow + Payout System
-- These functions help maintain seller balance integrity

-- Increment seller pending escrow balance
CREATE OR REPLACE FUNCTION increment_seller_pending_balance(
  p_seller_id UUID,
  p_amount DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE sellers
  SET pending_escrow_balance = COALESCE(pending_escrow_balance, 0) + p_amount
  WHERE id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement seller pending escrow balance
CREATE OR REPLACE FUNCTION decrement_seller_pending_balance(
  p_seller_id UUID,
  p_amount DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE sellers
  SET pending_escrow_balance = COALESCE(pending_escrow_balance, 0) - p_amount
  WHERE id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Increment seller available balance
CREATE OR REPLACE FUNCTION increment_seller_available_balance(
  p_seller_id UUID,
  p_amount DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE sellers
  SET available_balance = COALESCE(available_balance, 0) + p_amount
  WHERE id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement seller available balance
CREATE OR REPLACE FUNCTION decrement_seller_available_balance(
  p_seller_id UUID,
  p_amount DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE sellers
  SET available_balance = COALESCE(available_balance, 0) - p_amount
  WHERE id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Move funds from pending to available (on escrow release)
CREATE OR REPLACE FUNCTION move_pending_to_available(
  p_seller_id UUID,
  p_amount DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE sellers
  SET 
    pending_escrow_balance = COALESCE(pending_escrow_balance, 0) - p_amount,
    available_balance = COALESCE(available_balance, 0) + p_amount
  WHERE id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Increment total paid out (on successful payout)
CREATE OR REPLACE FUNCTION increment_seller_total_paid_out(
  p_seller_id UUID,
  p_amount DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE sellers
  SET total_paid_out = COALESCE(total_paid_out, 0) + p_amount
  WHERE id = p_seller_id;
END;
$$ LANGUAGE plpgsql;
