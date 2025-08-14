-- Migration: Add return-related fields to orders_new table
-- Run this script on existing databases to add the new fields
-- Add return_reason field
ALTER TABLE miler.orders_new
ADD COLUMN IF NOT EXISTS return_reason TEXT DEFAULT NULL;

-- Add return_initiated field
ALTER TABLE miler.orders_new
ADD COLUMN IF NOT EXISTS return_initiated BOOLEAN DEFAULT FALSE;

-- Add return_picked field
ALTER TABLE miler.orders_new
ADD COLUMN IF NOT EXISTS return_picked BOOLEAN DEFAULT FALSE;

-- Add return_delivered field
ALTER TABLE miler.orders_new
ADD COLUMN IF NOT EXISTS return_delivered BOOLEAN DEFAULT FALSE;

-- Add shipping_adjustment field
ALTER TABLE miler.orders_new
ADD COLUMN IF NOT EXISTS shipping_adjustment TEXT DEFAULT NULL;

-- Add payable_amount field
ALTER TABLE miler.orders_new
ADD COLUMN IF NOT EXISTS payable_amount TEXT DEFAULT NULL;

-- Add return_status field
ALTER TABLE miler.orders_new
ADD COLUMN IF NOT EXISTS return_status TEXT DEFAULT NULL;

-- Update existing records to have default values for boolean fields
UPDATE miler.orders_new
SET
    return_initiated = FALSE,
    return_picked = FALSE,
    return_delivered = FALSE
WHERE
    return_initiated IS NULL
    OR return_picked IS NULL
    OR return_delivered IS NULL;

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
    AND column_name IN (
        'return_reason',
        'return_initiated',
        'return_picked',
        'return_delivered',
        'shipping_adjustment',
        'payable_amount',
        'return_status'
    )
ORDER BY
    column_name;