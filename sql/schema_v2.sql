-- Updated Schema v2 with Products and Order Items
-- Create miler schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS miler;

-- Customers table (keep existing)
CREATE TABLE IF NOT EXISTS miler.customers (
    id SERIAL PRIMARY KEY,
    customer_name TEXT,
    contact_no NUMERIC UNIQUE,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS miler.products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    base_price DECIMAL(10,2),
    available_colors TEXT[],
    available_sizes TEXT[],
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Updated Orders table (remove product-specific columns)
CREATE TABLE IF NOT EXISTS miler.orders_new (
    id SERIAL PRIMARY KEY,
    order_id TEXT UNIQUE,
    customer_id INTEGER REFERENCES miler.customers(id),
    order_date DATE,
    state TEXT,
    total_amount DECIMAL(10,2),
    payment_mode TEXT,
    payment_received BOOLEAN DEFAULT FALSE,
    order_confirmation TEXT,
    order_status TEXT DEFAULT 'New',
    comments TEXT,
    process_order BOOLEAN DEFAULT FALSE,
    order_packed BOOLEAN DEFAULT FALSE,
    order_cancelled BOOLEAN DEFAULT FALSE,
    delivered BOOLEAN DEFAULT FALSE,
    is_rto BOOLEAN DEFAULT FALSE,
    rto_reason TEXT,
    rto_received BOOLEAN DEFAULT FALSE,
    damaged BOOLEAN DEFAULT FALSE,
    review_taken TEXT,
    customer_review TEXT,
    product_review TEXT,
    is_return BOOLEAN DEFAULT FALSE,
    return_reason TEXT DEFAULT NULL,
    return_initiated BOOLEAN DEFAULT FALSE,
    return_picked BOOLEAN DEFAULT FALSE,
    return_delivered BOOLEAN DEFAULT FALSE,
    shipping_adjustment TEXT DEFAULT NULL,
    payable_amount TEXT DEFAULT NULL,
    return_status TEXT DEFAULT NULL,
    whatsapp_notification_failed_reason TEXT,
    meta_data JSONB DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table (junction table)
CREATE TABLE IF NOT EXISTS miler.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES miler.orders_new(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES miler.products(id),
    selected_colors TEXT[],
    selected_sizes TEXT[],
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample products
INSERT INTO miler.products (product_code, product_name, category, base_price, available_colors, available_sizes, description) VALUES
('MTSH09', 'Raglan T-Shirt', 'T-Shirt', 299.99, 
 ARRAY['Airforce Blue', 'Royal Blue', 'Rama Green', 'Yellow', 'Black', 'White', 'Light Gray', 'Peach', 'Dark Gray', 'Navy Blue', 'Maroon', 'Forest Green', 'Bottle Green', 'Wine', 'Sky Blue', 'Neon'], 
 ARRAY['M', 'L', 'XL', '2XL', '3XL', '4XL'], 
 'Premium quality raglan sleeve t-shirt'),
 
('MTSH06', 'Polo T-Shirt', 'Polo', 399.99,
 ARRAY['Airforce Blue', 'Royal Blue', 'Rama Green', 'Yellow', 'Black', 'White', 'Light Gray', 'Peach', 'Dark Gray', 'Navy Blue', 'Maroon', 'Forest Green', 'Bottle Green', 'Wine', 'Sky Blue', 'Neon'],
 ARRAY['M', 'L', 'XL', '2XL', '3XL', '4XL'],
 'Classic polo t-shirt with collar'),

('MSHR05', 'Athletic Short', 'Shorts', 199.99,
 ARRAY['Airforce Blue', 'Royal Blue', 'Rama Green', 'Yellow', 'Black', 'White', 'Light Gray', 'Peach', 'Dark Gray', 'Navy Blue', 'Maroon', 'Forest Green', 'Bottle Green', 'Wine', 'Sky Blue', 'Neon'],
 ARRAY['M', 'L', 'XL', '2XL', '3XL', '4XL'],
 'Comfortable athletic shorts for sports'),

('MPYJ02', 'Jogger Pants', 'Pants', 499.99,
 ARRAY['Airforce Blue', 'Royal Blue', 'Rama Green', 'Yellow', 'Black', 'White', 'Light Gray', 'Peach', 'Dark Gray', 'Navy Blue', 'Maroon', 'Forest Green', 'Bottle Green', 'Wine', 'Sky Blue', 'Neon'],
 ARRAY['M', 'L', 'XL', '2XL', '3XL', '4XL'],
 'Premium jogger pants with elastic waistband'),

('MTRA04', 'Track Jacket', 'Jacket', 699.99,
 ARRAY['Airforce Blue', 'Royal Blue', 'Rama Green', 'Yellow', 'Black', 'White', 'Light Gray', 'Peach', 'Dark Gray', 'Navy Blue', 'Maroon', 'Forest Green', 'Bottle Green', 'Wine', 'Sky Blue', 'Neon'],
 ARRAY['M', 'L', 'XL', '2XL', '3XL', '4XL'],
 'Lightweight track jacket with zipper');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_code ON miler.products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_active ON miler.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON miler.orders_new(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON miler.orders_new(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON miler.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON miler.order_items(product_id);