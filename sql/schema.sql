-- Create miler schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS miler;

-- Customers table
CREATE TABLE
    IF NOT EXISTS miler.customers (
        id SERIAL PRIMARY KEY,
        customer_name TEXT,
        contact_no NUMERIC UNIQUE,
        email TEXT,
        address TEXT,
        city TEXT,
        country TEXT
    );

-- Orders table
CREATE TABLE
    IF NOT EXISTS miler.orders (
        id SERIAL PRIMARY KEY,
        order_id TEXT UNIQUE,
        date DATE,
        state TEXT,
        item TEXT,
        color1 TEXT,
        color2 TEXT,
        color3 TEXT,
        size TEXT,
        qty INTEGER,
        amount REAL,
        payment_mode TEXT,
        payment_received BOOLEAN DEFAULT FALSE,
        order_confirmation TEXT,
        reason TEXT,
        process_order BOOLEAN DEFAULT FALSE,
        order_packed BOOLEAN DEFAULT FALSE,
        order_cancelled BOOLEAN DEFAULT FALSE,
        delivered BOOLEAN DEFAULT FALSE,
        is_rto BOOLEAN DEFAULT FALSE,
        remarks TEXT,
        rto_reason TEXT,
        review_taken TEXT,
        customer_review TEXT,
        product_review TEXT,
        is_return BOOLEAN DEFAULT FALSE,
        whatsapp_notification_failed_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        customer_id INTEGER REFERENCES miler.customers (id)
    );