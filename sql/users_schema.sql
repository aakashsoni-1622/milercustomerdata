-- Users and Authentication Schema
-- Run this after the main schema.sql

-- Create users table with role-based access
CREATE TABLE IF NOT EXISTS miler.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'CUSTOMER_SUPPORT', 'VIEWER')),
    is_active BOOLEAN DEFAULT TRUE,
    phone VARCHAR(15),
    department VARCHAR(50),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES miler.users(id),
    updated_by INTEGER REFERENCES miler.users(id)
);

-- Create user sessions table for session management
CREATE TABLE IF NOT EXISTS miler.user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES miler.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit log table for user actions
CREATE TABLE IF NOT EXISTS miler.user_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES miler.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON miler.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON miler.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON miler.users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON miler.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON miler.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON miler.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON miler.user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON miler.user_audit_log(created_at);

-- Insert default super admin user (password: admin123 - change this!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO miler.users (
    username, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    department,
    is_active
) VALUES (
    'superadmin',
    'admin@miler.com',
    '$2b$12$TMUn4dSVgJ.CXc1SmHdWLOHhYLLl3XpDBcDIHBhwKZumQ3yTlTnY.',
    'Super',
    'Admin',
    'SUPER_ADMIN',
    'IT',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION miler.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON miler.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON miler.users
    FOR EACH ROW
    EXECUTE FUNCTION miler.update_updated_at_column();

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION miler.clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM miler.user_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- View for user details without password
CREATE OR REPLACE VIEW miler.user_details AS
SELECT 
    id,
    username,
    email,
    first_name,
    last_name,
    role,
    is_active,
    phone,
    department,
    last_login,
    created_at,
    updated_at
FROM miler.users
WHERE is_active = TRUE;