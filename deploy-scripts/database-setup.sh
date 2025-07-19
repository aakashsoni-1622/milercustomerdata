#!/bin/bash

# Database Setup Script for Miler Customer Data Project
# Run this script to set up the database schema

echo "🗄️ Setting up database schema for Miler Customer Data Project..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set!"
    echo "Please set it with your PostgreSQL connection string."
    echo "Example: export DATABASE_URL='postgresql://postgres:password@host:5432/milercustomerdata'"
    exit 1
fi

# Extract database connection details from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "🔗 Connecting to database: $DB_NAME on $DB_HOST:$DB_PORT"

# Test database connection
echo "🔍 Testing database connection..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo "Please check your DATABASE_URL and ensure the database is accessible."
    exit 1
fi

# Run schema file
echo "📝 Running database schema..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f sql/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
    
    # Verify tables were created
    echo "🔍 Verifying tables..."
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt miler.*"
    
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "Tables created:"
    echo "- miler.customers"
    echo "- miler.orders"
    echo ""
    echo "You can now connect to your application!"
else
    echo "❌ Database schema creation failed!"
    echo "Please check the schema file and try again."
    exit 1
fi 