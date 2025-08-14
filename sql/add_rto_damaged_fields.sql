-- Migration: Add rto_received and damaged fields to orders_new table
-- Run this script on existing databases to add the new fields
-- Add rto_received field
ALTER TABLE miler.orders_new
ADD COLUMN IF NOT EXISTS rto_received BOOLEAN DEFAULT FALSE;

ALTER TABLE miler.orders_new
ADD COLUMN IF NOT EXISTS meta_data TEXT DEFAULT NULL;

-- Add damaged field  
ALTER TABLE miler.orders_new
ADD COLUMN IF NOT EXISTS damaged BOOLEAN DEFAULT FALSE;

-- Update existing records to have default values
UPDATE miler.orders_new
SET
    rto_received = FALSE,
    damaged = FALSE,
    meta_data = NULL
WHERE
    rto_received IS NULL
    OR damaged IS NULL
    OR meta_data IS NULL;

-- Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'miler'
    AND table_name = 'orders_new'
    AND column_name IN ('rto_received', 'damaged', 'meta_data')
ORDER BY
    column_name;