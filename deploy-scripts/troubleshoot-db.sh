#!/bin/bash

# Database Troubleshooting Script
# Run this script to diagnose RDS connection issues

echo "🔍 Database Connection Troubleshooting Script"
echo "=============================================="

# Check if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please set it first:"
    echo "export DATABASE_URL='postgresql://postgres:password@host:5432/milercustomerdata'"
    exit 1
fi

# Extract connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')

echo "📋 Connection Details:"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Test 1: Basic network connectivity
echo "🔍 Test 1: Network Connectivity"
echo "Testing connection to $DB_HOST:$DB_PORT..."

if command -v telnet &> /dev/null; then
    timeout 10 telnet $DB_HOST $DB_PORT
    if [ $? -eq 0 ]; then
        echo "✅ Network connectivity: SUCCESS"
    else
        echo "❌ Network connectivity: FAILED"
        echo "   This indicates a security group or network issue"
    fi
else
    echo "⚠️  telnet not available, trying nc..."
    if command -v nc &> /dev/null; then
        timeout 10 nc -zv $DB_HOST $DB_PORT
        if [ $? -eq 0 ]; then
            echo "✅ Network connectivity: SUCCESS"
        else
            echo "❌ Network connectivity: FAILED"
        fi
    else
        echo "⚠️  Neither telnet nor nc available"
    fi
fi

echo ""

# Test 2: DNS resolution
echo "🔍 Test 2: DNS Resolution"
nslookup $DB_HOST
if [ $? -eq 0 ]; then
    echo "✅ DNS resolution: SUCCESS"
else
    echo "❌ DNS resolution: FAILED"
fi

echo ""

# Test 3: Ping test (if allowed)
echo "🔍 Test 3: Ping Test"
ping -c 3 $DB_HOST
if [ $? -eq 0 ]; then
    echo "✅ Ping test: SUCCESS"
else
    echo "⚠️  Ping test: FAILED (this is normal for RDS)"
fi

echo ""

# Test 4: PostgreSQL connection
echo "🔍 Test 4: PostgreSQL Connection"
echo "Attempting to connect to PostgreSQL..."

# Extract password for PGPASSWORD
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
export PGPASSWORD=$DB_PASS

# Test connection with timeout
timeout 30 psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL connection: SUCCESS"
    echo ""
    echo "🎉 Database is accessible!"
    echo "You can now run your schema setup."
else
    echo "❌ PostgreSQL connection: FAILED"
    echo ""
    echo "🔧 Troubleshooting Steps:"
    echo "1. Check RDS Security Group inbound rules"
    echo "2. Verify RDS instance is 'Available'"
    echo "3. Ensure 'Public access' is enabled"
    echo "4. Check your credentials"
    echo "5. Verify you're connecting from an allowed IP"
fi

echo ""
echo "📋 Common Solutions:"
echo "==================="
echo "1. Security Group: Add inbound rule for PostgreSQL (port 5432)"
echo "2. Public Access: Enable public access in RDS settings"
echo "3. Credentials: Double-check username and password"
echo "4. Network: Ensure you're not behind a restrictive firewall"
echo "5. RDS Status: Wait for database to be fully available" 