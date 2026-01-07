-- ============================================
-- ADD is_archived TO monitoring_status
-- ============================================
-- Execute in: Supabase Dashboard → SQL Editor

-- Add is_archived column to monitoring_status
ALTER TABLE monitoring_status 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_monitoring_status_archived 
ON monitoring_status(is_archived);

-- Safety: Set any NULL values to false
UPDATE monitoring_status 
SET is_archived = FALSE 
WHERE is_archived IS NULL;

-- Add comment
COMMENT ON COLUMN monitoring_status.is_archived IS 'Soft delete flag - true when topic is marked as OK/resolved';

-- ============================================
-- VERIFICATION
-- ============================================
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'monitoring_status' 
AND column_name = 'is_archived';
