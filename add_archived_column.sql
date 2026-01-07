-- Add archive functionality to sales_status table
-- This enables soft delete (hiding sales from view without removing data)

-- Add is_archived column with default false
ALTER TABLE sales_status 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Create index for efficient filtering of archived/non-archived sales
CREATE INDEX IF NOT EXISTS idx_sales_status_archived 
ON sales_status(is_archived);

-- Update any existing NULL values to false (safety measure)
UPDATE sales_status 
SET is_archived = false 
WHERE is_archived IS NULL;

-- Comment on column for documentation
COMMENT ON COLUMN sales_status.is_archived IS 'Soft delete flag - when true, sale is hidden from main view but data is preserved';
