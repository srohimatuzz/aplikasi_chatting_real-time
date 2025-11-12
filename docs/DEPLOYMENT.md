# 📦 Deployment ke Production

## Architecture Overview

\`\`\`
┌─────────────────────────────────────┐
│          VPS / Server               │
│  ┌──────────────────────────────┐   │
│  │   Node.js Chat Server        │   │
│  │   Port: 8080 (WebSocket)     │   │
│  │   Process Manager: PM2       │   │
│  │   Reverse Proxy: Nginx       │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Firewall (UFW)             │   │
│  │   SSL/TLS (Optional)         │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
         ↕ (WebSocket: wss://)
┌─────────────────────────────────────┐
│        Client Browsers              │
│ ├─ Browser Tab 1                    │
│ ├─ Browser Tab 2                    │
│ └─ Browser Tab 3+                   │
└─────────────────────────────────────┘
\`\`\`

## Production Checklist

- [ ] Server running on VPS
- [ ] Firewall configured
- [ ] SSL/TLS enabled (optional but recommended)
- [ ] PM2 process manager setup
- [ ] Monitoring & logging active
- [ ] Backup strategy implemented
- [ ] Resource limits set

## SSL/TLS Setup (Optional)

### Install Certbot
\`\`\`bash
apt-get install certbot python3-certbot-nginx
\`\`\`

### Get Certificate
\`\`\`bash
certbot certonly --standalone -d yourdomain.com
\`\`\`

### Update Client URL
\`\`\`
From: ws://yourdomain.com:8080
To:   wss://yourdomain.com:8080
\`\`\`

## Performance Optimization

### 1. Increase Connection Limit
\`\`\`bash
# Edit /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
\`\`\`

### 2. Tune Network
\`\`\`bash
# Edit /etc/sysctl.conf
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 65536
\`\`\`

### 3. Load Testing
\`\`\`bash
# Install artillery
npm install -g artillery

# Create artillery-config.yml
# Run: artillery run artillery-config.yml
\`\`\`

## Monitoring & Logging

### PM2 Dashboard
\`\`\`bash
pm2 web
# Access at http://localhost:9615
\`\`\`

### View Logs
\`\`\`bash
pm2 logs chat-server
pm2 logs chat-server --lines 100
\`\`\`

### Save Logs to File
\`\`\`bash
pm2 start server.js --name "chat-server" \\
  --log "./logs/chat.log" \\
  --error "./logs/chat-error.log"
\`\`\`

## Scaling

### Multiple Servers (Load Balancing)
\`\`\`
                    ┌─ Server 1 (8080)
Client → Load Balancer (Nginx)
                    ├─ Server 2 (8081)
                    └─ Server 3 (8082)
\`\`\`

Requires:
- Shared message store (Redis)
- Socket.io Adapter
- Nginx load balancer

### Redis Setup
\`\`\`bash
apt-get install redis-server
systemctl start redis-server

# Modify server.js to use Redis adapter
npm install socket.io-redis
\`\`\`

## Backup Strategy

### Backup Server Code
\`\`\`bash
# Cron job for daily backup
0 2 * * * tar -czf /backup/chat-app-\$(date +\\%Y\\%m\\%d).tar.gz /home/myapp/chat-app
\`\`\`

### Monitor Disk Space
\`\`\`bash
df -h  # Check disk usage
du -sh /home/myapp/*  # Check directory sizes
\`\`\`

## Troubleshooting Production

### High CPU Usage
\`\`\`bash
pm2 monit
# Check which component using CPU
top -p <PID>
\`\`\`

### Memory Leaks
\`\`\`bash
# Enable profiling
pm2 start server.js --node-args="--max-old-space-size=2048"
\`\`\`

### Connection Issues
\`\`\`bash
# Check open connections
netstat -an | grep 8080 | wc -l

# Monitor real-time
watch 'netstat -an | grep 8080 | wc -l'
\`\`\`

## Security Best Practices

1. **Firewall**: Only allow necessary ports
2. **SSL/TLS**: Encrypt WebSocket with wss://
3. **Rate Limiting**: Prevent spam/abuse
4. **Input Validation**: Sanitize all messages
5. **Authentication**: Implement user auth (future)
6. **Logging**: Monitor all activities

## Cost Estimation

### Typical VPS Specs
- CPU: 2 cores
- RAM: 2-4 GB
- Bandwidth: 1-2 Tbps
- Cost: $5-20/month

### For 1000+ concurrent users
- CPU: 4+ cores
- RAM: 8-16 GB
- Dedicated server or cloud cluster
- Cost: $50-200+/month

## Next Steps

1. Deploy server to VPS
2. Test with Wireshark monitoring
3. Load test with multiple clients
4. Implement SSL/TLS
5. Set up monitoring & alerts
6. Add authentication (if needed)
7. Implement message persistence (if needed)
\`\`\`
