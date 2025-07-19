#!/bin/bash

# EC2 Setup Script for Miler Customer Data Project
# Run this script on your EC2 instance after connecting via SSH

echo "🚀 Setting up EC2 instance for Miler Customer Data Project..."

# Update system
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
echo "📦 Installing Git..."
sudo yum install -y git

# Install PostgreSQL client
echo "📦 Installing PostgreSQL client..."
sudo yum install -y postgresql15

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo yum install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
sudo yum install -y certbot python3-certbot-nginx

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /home/ec2-user/milercustomerdata

# Set proper permissions
sudo chown -R ec2-user:ec2-user /home/ec2-user/milercustomerdata

echo "✅ EC2 setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone https://github.com/yourusername/milercustomerdata.git"
echo "2. Configure environment variables"
echo "3. Install dependencies and build the application"
echo "4. Start the application with PM2" 