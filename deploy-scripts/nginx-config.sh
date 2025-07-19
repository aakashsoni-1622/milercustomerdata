#!/bin/bash

# Nginx Configuration Script for Miler Customer Data Project
# Run this script on your EC2 instance after deploying the application

echo "🌐 Configuring Nginx for Miler Customer Data Application..."

# Backup existing nginx config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Create nginx configuration for the application
sudo tee /etc/nginx/conf.d/miler-app.conf << EOF
server {
    listen 80;
    server_name _;  # Replace with your domain if you have one

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Proxy to Next.js application
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Static files (if any)
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Cache static files
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Test nginx configuration
echo "🔍 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid!"
    
    # Start/restart nginx
    echo "🔄 Starting Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    echo "✅ Nginx configured and started successfully!"
    echo ""
    echo "Your application should now be accessible at:"
    echo "http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
    echo ""
    echo "To configure SSL with Let's Encrypt (if you have a domain):"
    echo "sudo certbot --nginx -d your-domain.com"
else
    echo "❌ Nginx configuration test failed!"
    echo "Please check the configuration and try again."
fi 