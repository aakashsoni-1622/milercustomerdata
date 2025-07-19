# 🔧 RDS Connection Timeout Fix

## 🚨 Your Issue

```
Connection timed out (0x0000274C/10060)
Is the server running on that host and accepting TCP/IP connections?
```

## ✅ Quick Fix Steps

### **Step 1: Fix Security Group (Most Common Cause)**

1. **Go to AWS RDS Console**

   - Find your database: `miler-customer-db.crumomwawv8j.ap-south-1.rds.amazonaws.com`
   - Click on the **Security group** link

2. **Add Inbound Rule**

   ```
   Type: PostgreSQL
   Protocol: TCP
   Port: 5432
   Source: 0.0.0.0/0
   Description: Allow PostgreSQL access
   ```

3. **Save the rule**

### **Step 2: Verify RDS Settings**

1. **Check Public Access**

   - In RDS Console → Databases → Your DB
   - Ensure "Public access" = **Yes**

2. **Check Status**
   - Ensure status = **Available** (not "Creating" or "Modifying")

### **Step 3: Test Connection**

Run this command to test:

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@miler-customer-db.crumomwawv8j.ap-south-1.rds.amazonaws.com:5432/milercustomerdata"

# Run the troubleshooting script
chmod +x deploy-scripts/troubleshoot-db.sh
./deploy-scripts/troubleshoot-db.sh
```

## 🔍 Alternative Connection Test

If you don't have the script, test manually:

```bash
# Test network connectivity
telnet miler-customer-db.crumomwawv8j.ap-south-1.rds.amazonaws.com 5432

# Test PostgreSQL connection
psql -h miler-customer-db.crumomwawv8j.ap-south-1.rds.amazonaws.com -U postgres -d milercustomerdata
```

## 🛡️ Security Group Configuration Details

### **What to Add:**

```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: 0.0.0.0/0 (for testing)
Description: Allow PostgreSQL access
```

### **For Production (Later):**

```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: Your EC2 Security Group ID (sg-xxxxxxxxx)
Description: Allow PostgreSQL from EC2 only
```

## 🚀 After Fix

Once connection works:

1. **Run Database Setup:**

   ```bash
   ./deploy-scripts/database-setup.sh
   ```

2. **Verify Tables:**
   ```bash
   psql -h miler-customer-db.crumomwawv8j.ap-south-1.rds.amazonaws.com -U postgres -d milercustomerdata -c "\dt miler.*"
   ```

## 📞 Still Having Issues?

If the above doesn't work:

1. **Check AWS Region**: Ensure you're in the correct region (ap-south-1)
2. **Check Firewall**: Ensure your local firewall allows outbound connections
3. **Check Credentials**: Verify username/password are correct
4. **Wait**: If RDS is still creating, wait for it to complete

## 🔒 Security Note

The `0.0.0.0/0` source allows connections from anywhere. For production:

- Restrict to your EC2 instance's security group
- Use VPC peering if possible
- Consider using AWS Secrets Manager for credentials
