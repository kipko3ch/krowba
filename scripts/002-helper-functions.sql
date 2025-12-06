-- Helper function to increment seller transactions
CREATE OR REPLACE FUNCTION increment_seller_transactions(seller_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE sellers 
  SET 
    total_transactions = total_transactions + 1,
    updated_at = NOW()
  WHERE id = seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment successful transactions
CREATE OR REPLACE FUNCTION increment_seller_success(seller_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE sellers 
  SET 
    successful_transactions = successful_transactions + 1,
    updated_at = NOW()
  WHERE id = seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to update verification score
CREATE OR REPLACE FUNCTION update_seller_verification_score(seller_id UUID)
RETURNS void AS $$
DECLARE
  success_count INTEGER;
  total_count INTEGER;
  new_score INTEGER;
BEGIN
  SELECT successful_transactions, total_transactions 
  INTO success_count, total_count
  FROM sellers WHERE id = seller_id;
  
  IF total_count > 0 THEN
    new_score := LEAST(100, (success_count::DECIMAL / total_count * 100)::INTEGER);
  ELSE
    new_score := 0;
  END IF;
  
  UPDATE sellers 
  SET verification_score = new_score, updated_at = NOW()
  WHERE id = seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
