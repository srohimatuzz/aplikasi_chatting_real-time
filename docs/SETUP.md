# 🚀 Setup & Installation Guide

## Prerequisites
- Node.js 14+ installed
- npm atau yarn
- VPS/Server dengan akses SSH
- Wireshark (optional, untuk monitoring traffic)

## Local Setup (Testing)

### 1. Install Dependencies
\`\`\`bash
cd server
npm install
\`\`\`

### 2. Start Server
\`\`\`bash
npm start
# Server berjalan di ws://localhost:8080
\`\`\`

### 3. Open Client
- Buka browser
- Buka beberapa tab dengan file `client/index.html`
- Masukkan URL: `ws://localhost:8080`
- Masukkan username
- Pilih room
- Click "Connect"

### 4. Testing Multiple Clients
- Tab 1: Username "Alice", Room "general"
- Tab 2: Username "Bob", Room "general"
- Tab 3: Username "Charlie", Room "tech"

Lihat pesan real-time berpindah antar clients!

## VPS Deployment

### 1. SSH ke VPS
\`\`\`bash
ssh root@your_vps_ip
\`\`\`

### 2. Setup Environment
\`\`\`bash
# Update system
apt-get update && apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2
\`\`\`

### 3. Clone & Setup Project
\`\`\`bash
cd /home/myapp
git clone <your-repo-url> chat-app
cd chat-app/server
npm install
\`\`\`

### 4. Configure Firewall
\`\`\`bash
# UFW (Ubuntu)
ufw allow 8080/tcp
ufw allow 22/tcp
ufw enable

# Or iptables
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
iptables-save
\`\`\`

### 5. Start Server with PM2
\`\`\`bash
pm2 start server.js --name "chat-server"
pm2 save
pm2 startup
\`\`\`

### 6. Monitor Server
\`\`\`bash
pm2 logs chat-server
pm2 status
\`\`\`

## Connect from Remote Client
\`\`\`
Server URL: ws://your_vps_ip:8080
\`\`\`

## Troubleshooting

### Port sudah digunakan
\`\`\`bash
# Find process using port 8080
lsof -i :8080
# Kill process
kill -9 <PID>
\`\`\`

### WebSocket connection refused
- Check firewall settings
- Ensure port 8080 is open
- Verify server is running: `pm2 logs chat-server`

### High memory usage
- Check `pm2 monit`
- May need to limit concurrent connections in code
\`\`\`
