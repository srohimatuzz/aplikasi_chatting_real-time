# Real-time Chat Application - VPS Deployment Guide

## Architecture

\`\`\`
┌─────────────────────┐
│   VPS (Production)  │
│  ┌───────────────┐  │
│  │ Next.js App   │  │
│  │ Port: 3000    │  │
│  │ API Routes    │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │ HTTP/API polling
           ▼
    ┌─────────────────────┐
    │  Multiple Clients    │
    │  (Browsers)         │
    │  - Alice            │
    │  - Bob              │
    │  - Charlie          │
    └─────────────────────┘
\`\`\`

## Step 1: VPS Setup

### Prerequisites
- Ubuntu 20.04+ or Debian 11+
- 512MB RAM minimum
- Node.js 18+ installed

### Install Dependencies
\`\`\`bash
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Verify
node -v
npm -v
pm2 -v
\`\`\`

## Step 2: Upload Project

### Option A: Git Clone
\`\`\`bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/your-username/chat-app.git
cd chat-app
\`\`\`

### Option B: SCP Upload
\`\`\`bash
scp -r chat-app root@YOUR_VPS_IP:/var/www/
\`\`\`

### Option C: Direct Upload
Use SFTP or FTP to upload project folder

## Step 3: Install Dependencies

\`\`\`bash
cd /var/www/chat-app
npm install
\`\`\`

## Step 4: Build Next.js App

\`\`\`bash
npm run build
\`\`\`

## Step 5: Configure Environment Variables

Create `.env.local`:
\`\`\`bash
nano .env.local
\`\`\`

Add:
\`\`\`env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com
\`\`\`

## Step 6: Start with PM2

\`\`\`bash
# Start Next.js production server
pm2 start npm --name "chat-app" -- start

# Configure auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs chat-app
\`\`\`

## Step 7: Configure Nginx (Reverse Proxy)

Edit Nginx config:
\`\`\`bash
sudo nano /etc/nginx/sites-available/default
\`\`\`

Replace with:
\`\`\`nginx
upstream nextjs_backend {
  server 127.0.0.1:3000;
}

server {
  listen 80 default_server;
  listen [::]:80 default_server;
  
  server_name YOUR_VPS_IP_OR_DOMAIN;

  location / {
    proxy_pass http://nextjs_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
\`\`\`

## Step 8: Setup SSL (HTTPS) - Optional but Recommended

Using Certbot:
\`\`\`bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
\`\`\`

## Step 9: Restart Services

\`\`\`bash
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verify Nginx
sudo systemctl status nginx
\`\`\`

## Step 10: Configure Firewall

\`\`\`bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
\`\`\`

## Monitoring & Maintenance

### Check Application Status
\`\`\`bash
# PM2 dashboard
pm2 status

# Real-time logs
pm2 logs chat-app

# Web dashboard
pm2 web  # Visit http://localhost:9615
\`\`\`

### Monitor with Wireshark

#### Remote Monitoring Setup
\`\`\`bash
# On VPS: Install tcpdump
sudo apt install -y tcpdump

# Create tunnel to monitor traffic
ssh -L 5000:localhost:3000 root@YOUR_VPS_IP

# On local: Wireshark
# Capture on lo (127.0.0.1)
# Filter: tcp port 5000
\`\`\`

#### Direct Monitoring
\`\`\`bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Monitor TCP traffic
sudo tcpdump -i eth0 -A 'tcp port 80 or tcp port 3000'

# Monitor specific API endpoint
sudo tcpdump -i eth0 -A 'host 127.0.0.1 and tcp port 3000'
\`\`\`

### Performance Monitoring
\`\`\`bash
# Check resource usage
top
free -h
df -h

# Monitor specific process
pm2 monit
\`\`\`

## Database Integration (Production)

For persistent storage, integrate a database:

### Option 1: PostgreSQL
\`\`\`bash
sudo apt install -y postgresql postgresql-contrib

# Connect and create database
sudo -u postgres psql
CREATE DATABASE chat_app;
\`\`\`

Then update API routes to use database instead of in-memory storage.

### Option 2: MongoDB
\`\`\`bash
# Add MongoDB repo
curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org
\`\`\`

## Backup & Recovery

### Automated Backups
\`\`\`bash
# Create backup script
cat > /usr/local/bin/backup-chat.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/chat-app"
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/chat-app-$(date +%Y%m%d-%H%M%S).tar.gz /var/www/chat-app
echo "Backup completed"
EOF

chmod +x /usr/local/bin/backup-chat.sh

# Schedule with cron
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-chat.sh
\`\`\`

## Troubleshooting

### Application won't start
\`\`\`bash
pm2 logs chat-app
pm2 delete chat-app
npm run build
pm2 start npm --name "chat-app" -- start
\`\`\`

### Port already in use
\`\`\`bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
\`\`\`

### Nginx errors
\`\`\`bash
sudo nginx -t  # Test config
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
\`\`\`

### High memory usage
\`\`\`bash
# Restart app
pm2 restart chat-app

# Increase memory limit
pm2 start npm --name "chat-app" --max-memory-restart 300M -- start
\`\`\`

## Production Checklist

- [ ] DNS configured
- [ ] SSL certificate installed
- [ ] Firewall rules set
- [ ] PM2 configured for auto-restart
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Database integrated (if needed)
- [ ] Rate limiting configured
- [ ] Logging enabled
- [ ] Load balancing configured (if scaling)

## Commands Reference

\`\`\`bash
# Application control
pm2 start npm --name "chat-app" -- start
pm2 restart chat-app
pm2 stop chat-app
pm2 delete chat-app

# Monitoring
pm2 status
pm2 logs
pm2 monit
pm2 web

# Nginx
sudo systemctl start/stop/restart/status nginx
sudo nginx -t

# System
top
free -h
df -h
netstat -tulpn
\`\`\`

## Support

For issues, check:
1. PM2 logs: `pm2 logs chat-app`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. System logs: `journalctl -xe`
4. Application monitoring: `pm2 web`
