-- Migration script to remove unused fields from orders_new table
-- Remove fields: process_order, order_packed, order_cancelled, delivered, is_rto, rto_reason
BEGIN;

-- Remove the unused columns
ALTER TABLE miler.orders_new
DROP COLUMN IF EXISTS process_order;

ALTER TABLE miler.orders_new
DROP COLUMN IF EXISTS order_packed;

ALTER TABLE miler.orders_new
DROP COLUMN IF EXISTS order_cancelled;

ALTER TABLE miler.orders_new
DROP COLUMN IF EXISTS delivered;

ALTER TABLE miler.orders_new
DROP COLUMN IF EXISTS is_rto;

ALTER TABLE miler.orders_new
DROP COLUMN IF EXISTS rto_reason;

-- Verify the changes
SELECT
    column_name,
    data_type
FROM
    information_schema.columns
WHERE
    table_schema = 'miler'
    AND table_name = 'orders_new'
ORDER BY
    ordinal_position;

COMMIT;