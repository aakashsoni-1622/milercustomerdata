# AWS Deployment Guide for Miler Customer Data Project

This guide will help you deploy your Next.js application with PostgreSQL database on AWS using the free tier.

## Prerequisites

- AWS Account (free tier eligible)
- Git installed on your local machine
- Node.js and npm installed
- AWS CLI installed and configured

## Step 1: Set Up AWS Account and Services

### 1.1 Create AWS Account

1. Go to [AWS Console](https://aws.amazon.com/)
2. Sign up for a new account
3. Add a credit card (required for free tier)
4. Complete identity verification

### 1.2 Install and Configure AWS CLI

```bash
# Download and install AWS CLI from https://aws.amazon.com/cli/
# Configure AWS CLI with your credentials
aws configure
```

## Step 2: Set Up PostgreSQL Database (RDS Free Tier)

### 2.1 Create RDS PostgreSQL Instance

1. Go to AWS RDS Console
2. Click "Create database"
3. Choose "Standard create"
4. Select "PostgreSQL" as engine
5. Choose "Free tier" template
6. Configure settings:
   - **DB instance identifier**: `miler-customer-db`
   - **Master username**: `postgres`
   - **Master password**: Create a strong password (save it!)
   - **DB instance class**: `db.t3.micro` (free tier)
   - **Storage**: 20 GB (free tier limit)
   - **Multi-AZ deployment**: No (free tier doesn't support)
   - **Public access**: Yes (for development)
   - **VPC security group**: Create new security group
   - **Database name**: `milercustomerdb`

### 2.2 Configure Security Group

1. Go to EC2 → Security Groups
2. Find the security group created for RDS
3. Add inbound rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: 0.0.0.0/0 (for development - restrict in production)

### 2.3 Get Database Connection Details

1. Go to RDS Console → Databases
2. Click on your database instance
3. Note the endpoint URL (e.g., `miler-customer-db.xxxxx.us-east-1.rds.amazonaws.com`)
4. Note the port (5432)

## Step 3: Set Up Database Schema

### 3.1 Connect to Database and Run Schema

```bash
# Install PostgreSQL client if not already installed
# On Windows: Download from https://www.postgresql.org/download/windows/

# Connect to your RDS instance
psql -h miler-customer-db.xxxxx.us-east-1.rds.amazonaws.com -U postgres -d milercustomerdb

# Run the schema file
\i sql/schema.sql
```

## Step 4: Set Up Application Hosting (EC2 Free Tier)

### 4.1 Launch EC2 Instance

1. Go to EC2 Console
2. Click "Launch Instance"
3. Configure:
   - **Name**: `miler-customer-app`
   - **AMI**: Amazon Linux 2023 (free tier eligible)
   - **Instance type**: t2.micro (free tier)
   - **Key pair**: Create new key pair (save the .pem file)
   - **Security group**: Create new security group
   - **Storage**: 8 GB (free tier)

### 4.2 Configure EC2 Security Group

1. Go to EC2 → Security Groups
2. Find the security group for your EC2 instance
3. Add inbound rules:
   - SSH (Port 22): Your IP address
   - HTTP (Port 80): 0.0.0.0/0
   - HTTPS (Port 443): 0.0.0.0/0
   - Custom TCP (Port 3000): 0.0.0.0/0 (for Next.js)

## Step 5: Deploy Application to EC2

### 5.1 Connect to EC2 Instance

```bash
# Replace with your key file path and instance details
ssh -i "your-key.pem" ec2-user@your-ec2-public-ip
```

### 5.2 Install Dependencies on EC2

```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PostgreSQL client
sudo yum install -y postgresql15

# Install PM2 for process management
sudo npm install -g pm2
```

### 5.3 Clone and Setup Application

```bash
# Clone your repository
git clone https://github.com/yourusername/milercustomerdata.git
cd milercustomerdata

# Install dependencies
npm install

# Build the application
npm run build
```

### 5.4 Configure Environment Variables

```bash
# Create .env.local file
cat > .env.local << EOF
DATABASE_URL=postgresql://postgres:your-password@miler-customer-db.xxxxx.us-east-1.rds.amazonaws.com:5432/milercustomerdata
NODE_ENV=production
EOF
```

### 5.5 Start Application with PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'miler-customer-app',
    script: 'npm',
    args: 'start',
    cwd: '/home/ec2-user/milercustomerdata',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start the application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 6: Set Up Domain and SSL (Optional)

### 6.1 Configure Domain (if you have one)

1. Go to Route 53 (if using AWS domain) or your domain provider
2. Create A record pointing to your EC2 public IP

### 6.2 Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Install Nginx
sudo yum install -y nginx

# Configure Nginx
sudo tee /etc/nginx/conf.d/miler-app.conf << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Step 7: Set Up CI/CD Pipeline (Optional)

### 7.1 Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_KEY }}
          script: |
            cd milercustomerdata
            git pull origin main
            npm install
            npm run build
            pm2 restart miler-customer-app
```

## Step 8: Monitoring and Maintenance

### 8.1 Set Up CloudWatch Monitoring

1. Go to CloudWatch Console
2. Create dashboard for your EC2 and RDS instances
3. Set up alarms for:
   - CPU utilization > 80%
   - Memory usage > 80%
   - Database connections > 80%

### 8.2 Regular Maintenance Tasks

```bash
# Update application
cd milercustomerdata
git pull origin main
npm install
npm run build
pm2 restart miler-customer-app

# Update system packages
sudo yum update -y

# Check logs
pm2 logs miler-customer-app
```

## Step 9: Cost Optimization

### 9.1 Free Tier Limits

- **EC2**: 750 hours/month of t2.micro
- **RDS**: 750 hours/month of db.t3.micro
- **Storage**: 20 GB for RDS, 8 GB for EC2
- **Data Transfer**: 15 GB outbound

### 9.2 Monitoring Costs

1. Set up AWS Budgets
2. Enable cost alerts
3. Monitor usage in AWS Cost Explorer

## Step 10: Security Best Practices

### 10.1 Database Security

- Change default passwords
- Restrict database access to EC2 instance only
- Enable encryption at rest
- Regular security updates

### 10.2 Application Security

- Use environment variables for secrets
- Enable HTTPS
- Regular dependency updates
- Input validation and sanitization

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**: Check security groups and credentials
2. **Application Not Starting**: Check PM2 logs and environment variables
3. **High CPU Usage**: Monitor and optimize queries
4. **Out of Memory**: Consider upgrading instance type

### Useful Commands:

```bash
# Check application status
pm2 status
pm2 logs

# Check system resources
htop
df -h

# Check database connection
psql -h your-db-endpoint -U postgres -d milercustomerdata

# Restart services
sudo systemctl restart nginx
pm2 restart all
```

## Next Steps

1. Set up automated backups for the database
2. Implement proper logging and monitoring
3. Set up staging environment
4. Configure auto-scaling (when out of free tier)
5. Implement proper error handling and health checks

## Important Notes

- Free tier has limitations and expires after 12 months
- Monitor usage to avoid unexpected charges
- Consider upgrading to paid tiers for production use
- Always backup your data regularly
- Keep your AWS credentials secure

This guide provides a basic setup for development/testing. For production deployment, consider additional security measures, monitoring, and scaling options.
