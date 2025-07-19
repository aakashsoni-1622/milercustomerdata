#!/bin/bash

# Application Deployment Script for Miler Customer Data Project
# Run this script on your EC2 instance after setup

echo "🚀 Deploying Miler Customer Data Application..."

# Navigate to application directory
cd /home/ec2-user/milercustomerdata

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

# Create PM2 ecosystem file if it doesn't exist
if [ ! -f ecosystem.config.js ]; then
    echo "📝 Creating PM2 ecosystem file..."
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
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF
fi

# Create logs directory
mkdir -p logs

# Start/Restart the application
echo "🔄 Starting application with PM2..."
pm2 start ecosystem.config.js --update-env

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

echo "✅ Application deployed successfully!"
echo ""
echo "Application status:"
pm2 status

echo ""
echo "To view logs: pm2 logs miler-customer-app"
echo "To restart: pm2 restart miler-customer-app"
echo "To stop: pm2 stop miler-customer-app" 