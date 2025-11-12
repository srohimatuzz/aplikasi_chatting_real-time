const http = require("http")
const WebSocket = require("ws")
const url = require("url")

// Port configuration
const PORT = process.env.PORT || 8080

// Store all connected clients dan rooms
const clients = new Map() // id -> {ws, username, room}
const rooms = new Map() // roomName -> Set of client ids

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chat Server</title>
        <style>
          body { font-family: Arial; margin: 20px; background: #1a1a1a; color: #fff; }
          h1 { color: #7c3aed; }
          .stats { background: #2a2a2a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          code { background: #333; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>🔌 Real-time Chat Server (WebSocket)</h1>
        <div class="stats">
          <p><strong>Server Status:</strong> ✅ RUNNING</p>
          <p><strong>Port:</strong> <code>${PORT}</code></p>
          <p><strong>Protocol:</strong> WebSocket (ws://)</p>
          <p><strong>Active Connections:</strong> <span id="connections">0</span></p>
          <p><strong>Active Rooms:</strong> <span id="rooms">0</span></p>
          <p style="margin-top: 15px; font-size: 12px; color: #888;">
            Open DevTools → Network tab to monitor WebSocket traffic
          </p>
        </div>
      </body>
      <script>
        setInterval(() => {
          fetch('/stats').then(r => r.json()).then(d => {
            document.getElementById('connections').textContent = d.connections;
            document.getElementById('rooms').textContent = d.rooms;
          });
        }, 1000);
      </script>
      </html>
    `)
  } else if (req.url === "/stats") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        connections: clients.size,
        rooms: rooms.size,
        timestamp: new Date().toISOString(),
      }),
    )
  } else {
    res.writeHead(404)
    res.end("Not Found")
  }
})

// Create WebSocket server
const wss = new WebSocket.Server({ server })

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function broadcastToRoom(roomName, message, excludeId = null) {
  const room = rooms.get(roomName)
  if (!room) return

  room.forEach((clientId) => {
    if (excludeId && clientId === excludeId) return

    const client = clients.get(clientId)
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message))
    }
  })
}

function broadcastToAllRooms(message) {
  clients.forEach((client, id) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message))
    }
  })
}

// WebSocket connection handler
wss.on("connection", (ws, req) => {
  const clientId = generateId()
  const clientData = {
    id: clientId,
    ws: ws,
    username: `User-${clientId.slice(0, 5)}`,
    room: null,
    joinedAt: new Date(),
  }

  clients.set(clientId, clientData)

  console.log(`[CONNECT] Client ${clientId} connected. Total: ${clients.size}`)

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data)

      switch (message.type) {
        case "JOIN":
          handleJoin(clientId, message)
          break
        case "MESSAGE":
          handleMessage(clientId, message)
          break
        case "LEAVE":
          handleLeave(clientId)
          break
        case "TYPING":
          handleTyping(clientId, message)
          break
        default:
          console.log(`[UNKNOWN] Client ${clientId}: ${message.type}`)
      }
    } catch (e) {
      console.error(`[ERROR] Parse message error: ${e.message}`)
    }
  })

  ws.on("close", () => {
    handleDisconnect(clientId)
  })

  ws.on("error", (error) => {
    console.error(`[ERROR] Client ${clientId} error: ${error.message}`)
  })
})

function handleJoin(clientId, message) {
  const client = clients.get(clientId)
  if (!client) return

  const oldRoom = client.room
  const newRoom = message.room || "general"
  const username = message.username || `User-${clientId.slice(0, 5)}`

  // Leave old room
  if (oldRoom) {
    const oldRoomClients = rooms.get(oldRoom)
    if (oldRoomClients) {
      oldRoomClients.delete(clientId)
      if (oldRoomClients.size === 0) {
        rooms.delete(oldRoom)
      }
    }

    broadcastToRoom(oldRoom, {
      type: "USER_LEFT",
      username: client.username,
      room: oldRoom,
      timestamp: new Date().toISOString(),
    })
  }

  // Join new room
  client.username = username
  client.room = newRoom

  if (!rooms.has(newRoom)) {
    rooms.set(newRoom, new Set())
  }
  rooms.get(newRoom).add(clientId)

  // Notify others
  broadcastToRoom(
    newRoom,
    {
      type: "USER_JOINED",
      username: username,
      userId: clientId,
      room: newRoom,
      roomUsers: Array.from(rooms.get(newRoom)).map((id) => ({
        id,
        username: clients.get(id).username,
      })),
      timestamp: new Date().toISOString(),
    },
    clientId,
  )

  // Send confirmation to client
  client.ws.send(
    JSON.stringify({
      type: "JOINED",
      username: username,
      room: newRoom,
      userId: clientId,
      roomUsers: Array.from(rooms.get(newRoom)).map((id) => ({
        id,
        username: clients.get(id).username,
      })),
      timestamp: new Date().toISOString(),
    }),
  )

  console.log(`[JOIN] ${username} joined room '${newRoom}'. Room size: ${rooms.get(newRoom).size}`)
}

function handleMessage(clientId, message) {
  const client = clients.get(clientId)
  if (!client || !client.room) return

  const chatMessage = {
    type: "MESSAGE",
    userId: clientId,
    username: client.username,
    text: message.text || "",
    room: client.room,
    timestamp: new Date().toISOString(),
  }

  broadcastToRoom(client.room, chatMessage)

  console.log(`[MSG] ${client.username}@${client.room}: ${message.text.slice(0, 50)}`)
}

function handleTyping(clientId, message) {
  const client = clients.get(clientId)
  if (!client || !client.room) return

  broadcastToRoom(
    client.room,
    {
      type: "TYPING",
      userId: clientId,
      username: client.username,
      isTyping: message.isTyping,
    },
    clientId,
  )
}

function handleLeave(clientId) {
  const client = clients.get(clientId)
  if (client && client.room) {
    const room = rooms.get(client.room)
    if (room) {
      room.delete(clientId)
      if (room.size === 0) {
        rooms.delete(client.room)
      }

      broadcastToRoom(client.room, {
        type: "USER_LEFT",
        username: client.username,
        userId: clientId,
        room: client.room,
        timestamp: new Date().toISOString(),
      })

      console.log(`[LEAVE] ${client.username} left room '${client.room}'`)
    }
  }
}

function handleDisconnect(clientId) {
  const client = clients.get(clientId)

  if (client && client.room) {
    const room = rooms.get(client.room)
    if (room) {
      room.delete(clientId)
      if (room.size === 0) {
        rooms.delete(client.room)
      }

      broadcastToRoom(client.room, {
        type: "USER_DISCONNECTED",
        username: client.username,
        userId: clientId,
        room: client.room,
        timestamp: new Date().toISOString(),
      })
    }
  }

  clients.delete(clientId)
  console.log(`[DISCONNECT] Client ${clientId} disconnected. Remaining: ${clients.size}`)
}

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════╗
║  Real-time Chat Server Started 🚀      ║
╠════════════════════════════════════════╣
║ Server: 0.0.0.0:${PORT}                        ║
║ Protocol: WebSocket (ws://)            ║
║ Monitoring: http://0.0.0.0:${PORT}     ║
║                                        ║
║ Ready for monitoring with Wireshark:   ║
║ - Open Wireshark                       ║
║ - Capture packets on eth0 (or your NIC)║
║ - Filter: "websocket"                  ║
╚════════════════════════════════════════╝
  `)
})

process.on("SIGINT", () => {
  console.log("\n[SHUTDOWN] Server shutting down...")
  server.close()
  process.exit(0)
})
