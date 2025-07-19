# Quick Deployment Checklist

## 🚀 AWS Free Tier Deployment Checklist

### Prerequisites ✅

- [ ] AWS Account created
- [ ] AWS CLI installed and configured
- [ ] Git repository ready
- [ ] Node.js and npm installed locally

### Step 1: Database Setup 🗄️

- [ ] Create RDS PostgreSQL instance (Free tier: db.t3.micro)
- [ ] Configure security group (Port 5432)
- [ ] Note database endpoint and credentials
- [ ] Run database setup script: `./deploy-scripts/database-setup.sh`

### Step 2: EC2 Instance Setup 🖥️

- [ ] Launch EC2 instance (Free tier: t2.micro)
- [ ] Configure security group (Ports 22, 80, 443, 3000)
- [ ] Download and save key pair (.pem file)
- [ ] Connect to EC2: `ssh -i "key.pem" ec2-user@your-ip`
- [ ] Run setup script: `./deploy-scripts/setup-ec2.sh`

### Step 3: Application Deployment 📦

- [ ] Clone repository on EC2
- [ ] Configure environment variables (.env.local)
- [ ] Run deployment script: `./deploy-scripts/deploy-app.sh`
- [ ] Configure Nginx: `./deploy-scripts/nginx-config.sh`

### Step 4: Domain & SSL (Optional) 🌐

- [ ] Configure domain DNS (if available)
- [ ] Set up SSL with Let's Encrypt
- [ ] Test HTTPS access

### Step 5: CI/CD Setup (Optional) 🔄

- [ ] Add GitHub repository secrets:
  - `EC2_HOST`: Your EC2 public IP
  - `EC2_KEY`: Your EC2 private key
- [ ] Push to main branch to trigger deployment

### Step 6: Monitoring 📊

- [ ] Set up CloudWatch alarms
- [ ] Configure AWS Budgets
- [ ] Test application functionality

## 📋 Environment Variables

Create `.env.local` on EC2:

```bash
DATABASE_URL=postgresql://postgres:your-password@your-db-endpoint:5432/milercustomerdata
NODE_ENV=production
```

## 🔧 Useful Commands

### Application Management

```bash
# Check application status
pm2 status

# View logs
pm2 logs miler-customer-app

# Restart application
pm2 restart miler-customer-app

# Stop application
pm2 stop miler-customer-app
```

### System Management

```bash
# Check system resources
htop
df -h

# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx
```

### Database Management

```bash
# Connect to database
psql -h your-db-endpoint -U postgres -d milercustomerdata

# Check tables
\dt miler.*

# Backup database
pg_dump -h your-db-endpoint -U postgres milercustomerdata > backup.sql
```

## 🆘 Troubleshooting

### Common Issues:

1. **Application not starting**: Check PM2 logs and environment variables
2. **Database connection failed**: Verify security groups and credentials
3. **Nginx not working**: Check configuration and restart service
4. **High CPU usage**: Monitor with CloudWatch and optimize

### Emergency Commands:

```bash
# Emergency restart everything
pm2 restart all
sudo systemctl restart nginx

# Check all services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

## 💰 Cost Monitoring

### Free Tier Limits:

- **EC2**: 750 hours/month (t2.micro)
- **RDS**: 750 hours/month (db.t3.micro)
- **Storage**: 20 GB RDS + 8 GB EC2
- **Data Transfer**: 15 GB outbound

### Cost Alerts:

- Set up AWS Budgets
- Monitor in Cost Explorer
- Enable billing alerts

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Restrict database access
- [ ] Enable HTTPS
- [ ] Regular security updates
- [ ] Backup data regularly
- [ ] Monitor access logs

## 📞 Support

If you encounter issues:

1. Check the detailed guide: `AWS_DEPLOYMENT_GUIDE.md`
2. Review logs: `pm2 logs` and `sudo journalctl`
3. Verify AWS service status
4. Check security group configurations

---

**Remember**: Free tier expires after 12 months. Monitor usage to avoid unexpected charges!
