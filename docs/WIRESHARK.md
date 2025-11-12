# 🔍 Monitoring dengan Wireshark

## Apa itu Wireshark?
Wireshark adalah tool untuk menangkap dan menganalisis traffic network dalam real-time. Perfect untuk melihat WebSocket traffic!

## Installation

### Windows/Mac
- Download dari https://www.wireshark.org/download/
- Install seperti aplikasi normal

### Linux
\`\`\`bash
sudo apt-get install wireshark
# Add user to wireshark group
sudo usermod -a -G wireshark $USER
\`\`\`

## Monitoring WebSocket Traffic

### 1. Start Wireshark
- Buka aplikasi Wireshark
- Pilih network interface (biasanya eth0 atau Ethernet)
- Click "Start capturing packets"

### 2. Filter WebSocket
Di filter box, masukkan:
\`\`\`
websocket
\`\`\`

### 3. Lihat Traffic
- Ketika client mengirim pesan, akan terlihat di Wireshark
- Format: opcode 0x81 (text frame), payload berisi JSON

### 4. Detailed Analysis
- Right-click pada packet → "Follow" → "WebSocket Stream"
- Akan menampilkan conversation lengkap

## Packet Structure

### WebSocket Frame Header
\`\`\`
FIN: 1 (final frame)
RSV: 000 (reserved)
Opcode: 0001 (text frame) atau 0010 (binary)
MASK: 1 (masked)
Payload length: variable
\`\`\`

### Example: Client mengirim message
\`\`\`
{"type":"MESSAGE","text":"Hello World"}
\`\`\`

## Advanced Filtering

### Hanya WebSocket Text Frames
\`\`\`
websocket.opcode == 0x1
\`\`\`

### WebSocket dengan Close
\`\`\`
websocket.opcode == 0x8
\`\`\`

### Specific Protocol
\`\`\`
tcp.port == 8080 and websocket
\`\`\`

## Performance Analysis

### Packet Stats
- Statistics → Protocol Hierarchy
- Lihat berapa banyak WebSocket traffic

### Bandwidth Usage
- Statistics → Traffic Table
- Lihat size dari setiap packet

## Tips & Tricks

1. **Capture Options**: 
   - Resolve names untuk readable output
   - Disable promiscuous mode jika tidak perlu

2. **Export Data**:
   - File → Export Specified Packets
   - Export untuk dokumentasi

3. **Coloring**:
   - Set warna untuk WebSocket frames
   - Mudah diidentifikasi di capture besar

4. **Live Reload**:
   - Keep Wireshark open saat testing
   - Real-time view dari semua traffic

## Real-time Monitoring Demo

\`\`\`bash
# Terminal 1: Server
npm start

# Terminal 2: Wireshark
# Start capture → Filter: websocket

# Browser Tab 1: Client Alice
# Browser Tab 2: Client Bob

# Kirim pesan dari Alice
# Lihat di Wireshark: 2 packets (Bob receive, Alice ACK)
\`\`\`

## Common WebSocket Operations

| Operation | Opcode | Frame |
|-----------|--------|-------|
| Text | 0x1 | Message content |
| Binary | 0x2 | Binary data |
| Continuation | 0x0 | More data coming |
| Close | 0x8 | Connection close |
| Ping | 0x9 | Keep-alive |
| Pong | 0xA | Keep-alive response |

## Troubleshooting Wireshark

### No capture data
- Check network interface selected
- May need root/admin permissions
- Try different interface

### Can't see WebSocket
- Verify port 8080 is correct
- Check filter syntax
- Ensure WebSocket connection is active
\`\`\`
