-- Migration script from v1 to v2 schema
-- This script migrates existing data to the new normalized structure

-- Step 1: Run the new schema first
-- \i sql/schema_v2.sql

-- Step 2: Migrate existing customers (if needed)
-- The customers table structure is mostly the same, just add timestamps if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'miler' 
                   AND table_name = 'customers' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE miler.customers 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Step 3: Migrate existing orders data
-- Create a temporary function to migrate orders
CREATE OR REPLACE FUNCTION migrate_orders_to_v2() 
RETURNS void AS $$
DECLARE
    old_order RECORD;
    new_order_id INTEGER;
    product_names TEXT[];
    product_colors TEXT[];
    product_sizes TEXT[];
    i INTEGER;
    current_product_id INTEGER;
BEGIN
    -- Loop through each existing order
    FOR old_order IN 
        SELECT * FROM miler.orders 
        WHERE id NOT IN (SELECT DISTINCT order_id FROM miler.order_items WHERE order_id IS NOT NULL)
    LOOP
        -- Insert into new orders table
        INSERT INTO miler.orders_new (
            order_id,
            customer_id,
            order_date,
            state,
            total_amount,
            payment_mode,
            payment_received,
            order_confirmation,
            order_status,
            comments,
            process_order,
            order_packed,
            order_cancelled,
            delivered,
            is_rto,
            rto_reason,
            review_taken,
            customer_review,
            product_review,
            is_return,
            whatsapp_notification_failed_reason,
            created_at,
            updated_at
        ) VALUES (
            old_order.order_id,
            old_order.customer_id,
            old_order.date,
            old_order.state,
            old_order.amount,
            old_order.payment_mode,
            old_order.payment_received,
            old_order.order_confirmation,
            CASE 
                WHEN old_order.order_cancelled THEN 'Cancelled'
                WHEN old_order.delivered THEN 'Delivered'
                WHEN old_order.order_packed THEN 'Packed'
                WHEN old_order.process_order THEN 'Processing'
                ELSE 'New'
            END,
            old_order.reason,
            old_order.process_order,
            old_order.order_packed,
            old_order.order_cancelled,
            old_order.delivered,
            old_order.is_rto,
            old_order.rto_reason,
            old_order.review_taken,
            old_order.customer_review,
            old_order.product_review,
            old_order.is_return,
            old_order.whatsapp_notification_failed_reason,
            old_order.created_at,
            old_order.updated_at
        ) RETURNING id INTO new_order_id;

        -- Parse the concatenated product data
        IF old_order.item IS NOT NULL AND old_order.item != '' THEN
            product_names := string_to_array(old_order.item, ', ');
            
            -- Handle colors - could be in color1, color2, color3 or comma-separated
            IF old_order.color1 IS NOT NULL THEN
                IF position(',' in old_order.color1) > 0 THEN
                    product_colors := string_to_array(old_order.color1, ', ');
                ELSE
                    product_colors := ARRAY[old_order.color1];
                    IF old_order.color2 IS NOT NULL THEN
                        product_colors := product_colors || old_order.color2;
                    END IF;
                    IF old_order.color3 IS NOT NULL THEN
                        product_colors := product_colors || old_order.color3;
                    END IF;
                END IF;
            ELSE
                product_colors := ARRAY['']::TEXT[];
            END IF;

            -- Handle sizes
            IF old_order.size IS NOT NULL AND old_order.size != '' THEN
                product_sizes := string_to_array(old_order.size, ', ');
            ELSE
                product_sizes := ARRAY['']::TEXT[];
            END IF;

            -- Create order items for each product
            FOR i IN 1..array_length(product_names, 1) LOOP
                -- Try to find existing product or create a generic one
                SELECT id INTO current_product_id 
                FROM miler.products 
                WHERE product_name = product_names[i] 
                   OR product_code = product_names[i]
                LIMIT 1;

                -- If product not found, try to match by partial name
                IF current_product_id IS NULL THEN
                    SELECT id INTO current_product_id 
                    FROM miler.products 
                    WHERE position(upper(product_names[i]) in upper(product_name)) > 0
                    LIMIT 1;
                END IF;

                -- If still not found, use the first available product or create a placeholder
                IF current_product_id IS NULL THEN
                    SELECT id INTO current_product_id FROM miler.products LIMIT 1;
                END IF;

                -- Insert order item
                IF current_product_id IS NOT NULL THEN
                    INSERT INTO miler.order_items (
                        order_id,
                        product_id,
                        selected_colors,
                        selected_sizes,
                        quantity,
                        unit_price,
                        total_price
                    ) VALUES (
                        new_order_id,
                        current_product_id,
                        CASE 
                            WHEN i <= array_length(product_colors, 1) AND product_colors[i] != '' 
                            THEN ARRAY[product_colors[i]]
                            ELSE ARRAY[]::TEXT[]
                        END,
                        CASE 
                            WHEN i <= array_length(product_sizes, 1) AND product_sizes[i] != '' 
                            THEN ARRAY[product_sizes[i]]
                            ELSE ARRAY[]::TEXT[]
                        END,
                        COALESCE(old_order.qty, 1),
                        COALESCE(old_order.amount / GREATEST(old_order.qty, 1), 0),
                        COALESCE(old_order.amount, 0)
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
-- SELECT migrate_orders_to_v2();

-- Step 4: Verification queries (run these after migration)
/*
-- Check migrated data
SELECT 
    o.order_id,
    c.customer_name,
    o.total_amount,
    COUNT(oi.id) as item_count
FROM miler.orders_new o
JOIN miler.customers c ON o.customer_id = c.id
LEFT JOIN miler.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_id, c.customer_name, o.total_amount
ORDER BY o.created_at DESC;

-- Check order items with product details
SELECT 
    o.order_id,
    p.product_code,
    p.product_name,
    oi.selected_colors,
    oi.selected_sizes,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM miler.orders_new o
JOIN miler.order_items oi ON o.id = oi.order_id
JOIN miler.products p ON oi.product_id = p.id
ORDER BY o.created_at DESC, oi.id;
*/

-- Step 5: Cleanup (ONLY run after verifying migration is successful)
/*
-- Rename old table for backup
ALTER TABLE miler.orders RENAME TO orders_v1_backup;

-- Rename new table to orders
ALTER TABLE miler.orders_new RENAME TO orders;

-- Drop the migration function
DROP FUNCTION IF EXISTS migrate_orders_to_v2();
*/

-- Add package.json script for easy migration
-- Add this to your package.json scripts:
-- "migrate:v2": "psql $DATABASE_URL -f sql/migration_v1_to_v2.sql"