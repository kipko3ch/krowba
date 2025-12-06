-- Supabase pg_cron for Auto-Release Escrow
-- Run this in Supabase SQL Editor
-- This replaces the Vercel cron job and runs every 6 hours

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the auto-release function
CREATE OR REPLACE FUNCTION auto_release_stale_escrows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  escrow_record RECORD;
  hours_elapsed NUMERIC;
BEGIN
  -- Find escrows that are held and have shipping proof older than 24 hours
  -- and no active disputes
  FOR escrow_record IN
    SELECT 
      e.id AS escrow_id,
      e.transaction_id,
      e.seller_id,
      e.amount,
      e.krowba_link_id,
      sp.dispatched_at,
      dc.confirmed
    FROM escrow_holds e
    INNER JOIN shipping_proofs sp ON sp.transaction_id = e.transaction_id
    LEFT JOIN delivery_confirmations dc ON dc.transaction_id = e.transaction_id
    LEFT JOIN disputes d ON d.transaction_id = e.transaction_id AND d.resolution = 'pending'
    WHERE e.status = 'held'
      AND dc.confirmed = false
      AND d.id IS NULL -- No pending disputes
      AND sp.dispatched_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Calculate hours elapsed
    hours_elapsed := EXTRACT(EPOCH FROM (NOW() - escrow_record.dispatched_at)) / 3600;
    
    RAISE NOTICE 'Auto-releasing escrow % after % hours', escrow_record.escrow_id, hours_elapsed;
    
    -- Update escrow to released
    UPDATE escrow_holds
    SET 
      status = 'released',
      released_at = NOW(),
      updated_at = NOW()
    WHERE id = escrow_record.escrow_id;
    
    -- Update delivery confirmation as auto-confirmed
    UPDATE delivery_confirmations
    SET 
      confirmed = true,
      confirmed_at = NOW(),
      auto_confirmed = true
    WHERE transaction_id = escrow_record.transaction_id;
    
    -- Update krowba link status
    UPDATE krowba_links
    SET 
      status = 'completed',
      updated_at = NOW()
    WHERE id = escrow_record.krowba_link_id;
    
    -- Update seller stats
    UPDATE sellers
    SET 
      successful_transactions = COALESCE(successful_transactions, 0) + 1,
      updated_at = NOW()
    WHERE id = escrow_record.seller_id;
    
  END LOOP;
END;
$$;

-- Schedule the cron job to run every 6 hours
-- Format: minute hour day month day-of-week
SELECT cron.schedule(
  'auto-release-escrows',  -- Job name
  '0 */6 * * *',           -- Every 6 hours
  'SELECT auto_release_stale_escrows()'
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule:
-- SELECT cron.unschedule('auto-release-escrows');

-- To run manually for testing:
-- SELECT auto_release_stale_escrows();
