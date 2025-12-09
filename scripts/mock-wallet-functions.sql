-- SQL Functions for Mock Wallet Management
-- These functions manage balance transfers for the mock payment system

-- Function: Move funds from available balance to total paid out
CREATE OR REPLACE FUNCTION move_available_to_paid(
    p_seller_id UUID,
    p_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE sellers
    SET 
        available_balance = available_balance - p_amount,
        total_paid_out = total_paid_out + p_amount,
        updated_at = NOW()
    WHERE id = p_seller_id;
    
    -- Ensure balances don't go negative
    IF (SELECT available_balance FROM sellers WHERE id = p_seller_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient available balance';
    END IF;
END;
$$;

-- Note: The following functions should already exist from the existing escrow system:
-- - increment_seller_pending_balance(p_seller_id UUID, p_amount DECIMAL)
-- - decrement_seller_pending_balance(p_seller_id UUID, p_amount DECIMAL)
-- - move_pending_to_available(p_seller_id UUID, p_amount DECIMAL)

-- If they don't exist, create them:

CREATE OR REPLACE FUNCTION increment_seller_pending_balance(
    p_seller_id UUID,
    p_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE sellers
    SET 
        pending_escrow_balance = pending_escrow_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_seller_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_seller_pending_balance(
    p_seller_id UUID,
    p_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE sellers
    SET 
        pending_escrow_balance = pending_escrow_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_seller_id;
    
    IF (SELECT pending_escrow_balance FROM sellers WHERE id = p_seller_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient pending balance';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION move_pending_to_available(
    p_seller_id UUID,
    p_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE sellers
    SET 
        pending_escrow_balance = pending_escrow_balance - p_amount,
        available_balance = available_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_seller_id;
    
    IF (SELECT pending_escrow_balance FROM sellers WHERE id = p_seller_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient pending balance';
    END IF;
END;
$$;
