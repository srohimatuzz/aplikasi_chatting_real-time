class ChatClient {
  constructor() {
    this.ws = null
    this.userId = null
    this.username = null
    this.room = "general"
    this.typingTimeout = null
    this.isTyping = false
    this.typingUsers = new Set()
    this.roomUsers = new Set()

    this.initializeElements()
    this.attachEventListeners()
  }

  initializeElements() {
    this.serverUrlInput = document.getElementById("serverUrl")
    this.usernameInput = document.getElementById("username")
    this.roomSelect = document.getElementById("roomSelect")
    this.connectBtn = document.getElementById("connectBtn")
    this.disconnectBtn = document.getElementById("disconnectBtn")
    this.status = document.getElementById("status")
    this.chatPanel = document.getElementById("chatPanel")
    this.messagesContainer = document.getElementById("messagesContainer")
    this.messageInput = document.getElementById("messageInput")
    this.sendBtn = document.getElementById("sendBtn")
    this.usersList = document.getElementById("usersList")
    this.roomBadge = document.getElementById("roomBadge")
  }

  attachEventListeners() {
    this.connectBtn.addEventListener("click", () => this.connect())
    this.disconnectBtn.addEventListener("click", () => this.disconnect())
    this.sendBtn.addEventListener("click", () => this.sendMessage())
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage()
    })
    this.messageInput.addEventListener("input", () => this.handleTyping())
    this.roomSelect.addEventListener("change", (e) => {
      this.room = e.target.value
      this.rejoinRoom()
    })
  }

  connect() {
    const serverUrl = this.serverUrlInput.value.trim()
    const username = this.usernameInput.value.trim() || `User-${Math.random().toString(36).slice(2, 7)}`
    this.room = this.roomSelect.value

    if (!serverUrl) {
      alert("Please enter server URL")
      return
    }

    this.setStatus("Connecting...", "connecting")

    try {
      this.ws = new WebSocket(serverUrl)

      this.ws.onopen = () => {
        console.log("[CONNECTED] WebSocket connected")
        this.username = username
        this.usernameInput.value = username
        this.setStatus("Connected", "connected")
        this.updateUIConnected()

        this.joinRoom(this.room, username)
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleServerMessage(message)
        } catch (e) {
          console.error("[ERROR] Failed to parse message:", e)
        }
      }

      this.ws.onerror = (error) => {
        console.error("[ERROR] WebSocket error:", error)
        this.setStatus("Error connecting", "disconnected")
      }

      this.ws.onclose = () => {
        console.log("[DISCONNECTED] WebSocket closed")
        this.setStatus("Disconnected", "disconnected")
        this.updateUIDisconnected()
      }
    } catch (e) {
      console.error("[ERROR] Connection failed:", e)
      this.setStatus("Connection failed", "disconnected")
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
    }
  }

  joinRoom(room, username) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    this.ws.send(
      JSON.stringify({
        type: "JOIN",
        room: room,
        username: username,
      }),
    )
  }

  rejoinRoom() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.messagesContainer.innerHTML = ""
      this.typingUsers.clear()
      this.roomUsers.clear()
      this.joinRoom(this.room, this.username)
    }
  }

  sendMessage() {
    const text = this.messageInput.value.trim()
    if (!text || !this.ws || this.ws.readyState !== WebSocket.OPEN) return

    this.ws.send(
      JSON.stringify({
        type: "MESSAGE",
        text: text,
      }),
    )

    this.messageInput.value = ""
    this.isTyping = false
    this.typingTimeout && clearTimeout(this.typingTimeout)
  }

  handleTyping() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    if (!this.isTyping) {
      this.isTyping = true
      this.ws.send(
        JSON.stringify({
          type: "TYPING",
          isTyping: true,
        }),
      )
    }

    clearTimeout(this.typingTimeout)
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false
      this.ws.send(
        JSON.stringify({
          type: "TYPING",
          isTyping: false,
        }),
      )
    }, 1000)
  }

  handleServerMessage(message) {
    console.log("[MSG]", message.type, message)

    switch (message.type) {
      case "JOINED":
        this.userId = message.userId
        this.roomUsers = new Set(message.roomUsers.map((u) => u.id))
        this.displaySystemMessage(`✅ Joined room "${message.room}"`)
        this.updateUsersList(message.roomUsers)
        this.roomBadge.textContent = message.room.toUpperCase()
        break

      case "MESSAGE":
        this.displayMessage(message)
        break

      case "USER_JOINED":
        this.roomUsers.add(message.userId)
        this.displaySystemMessage(`➕ ${message.username} joined`)
        this.updateUsersList(message.roomUsers)
        break

      case "USER_LEFT":
        this.roomUsers.delete(message.userId)
        this.displaySystemMessage(`➖ ${message.username} left`)
        this.typingUsers.delete(message.userId)
        this.updateTypingIndicator()
        break

      case "USER_DISCONNECTED":
        this.roomUsers.delete(message.userId)
        this.displaySystemMessage(`❌ ${message.username} disconnected`)
        this.typingUsers.delete(message.userId)
        this.updateTypingIndicator()
        break

      case "TYPING":
        if (message.userId !== this.userId) {
          if (message.isTyping) {
            this.typingUsers.add(message.userId)
          } else {
            this.typingUsers.delete(message.userId)
          }
          this.updateTypingIndicator()
        }
        break
    }
  }

  displayMessage(message) {
    const messageDiv = document.createElement("div")
    messageDiv.className = "message" + (message.userId === this.userId ? " own" : "")

    const bubble = document.createElement("div")
    bubble.className = "message-bubble"
    bubble.textContent = message.text

    const info = document.createElement("div")
    info.className = "message-info"
    info.innerHTML = `<strong>${message.username}</strong> • ${new Date(message.timestamp).toLocaleTimeString()}`

    messageDiv.appendChild(bubble)
    messageDiv.appendChild(info)
    this.messagesContainer.appendChild(messageDiv)
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
  }

  displaySystemMessage(text) {
    const msgDiv = document.createElement("div")
    msgDiv.className = "system-message"
    msgDiv.textContent = text
    this.messagesContainer.appendChild(msgDiv)
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
  }

  updateTypingIndicator() {
    const existing = this.messagesContainer.querySelector(".typing-indicator")
    if (existing) existing.remove()

    if (this.typingUsers.size === 0) return

    const typingNames = Array.from(this.typingUsers)
      .map((id) => {
        const user = Array.from(document.querySelectorAll(".user-item")).find((el) => el.textContent.includes(id))
        return user ? user.textContent.replace(/👥|User |•/g, "").trim() : "User"
      })
      .slice(0, 2)
      .join(", ")

    const div = document.createElement("div")
    div.className = "message"
    div.innerHTML = `
      <div style="display: flex; gap: 8px;">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
        <div style="font-size: 12px; color: #999; align-self: flex-end;">${typingNames} typing...</div>
      </div>
    `
    this.messagesContainer.appendChild(div)
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
  }

  updateUsersList(roomUsers) {
    this.usersList.innerHTML = ""
    roomUsers.forEach((user) => {
      const div = document.createElement("div")
      div.className = "user-item"
      div.innerHTML = `<span>${user.username}</span>`
      if (user.id === this.userId) {
        div.innerHTML += ' <span style="font-size: 10px; color: #999;">(you)</span>'
      }
      this.usersList.appendChild(div)
    })
  }

  updateUIConnected() {
    this.connectBtn.classList.add("hidden")
    this.disconnectBtn.classList.remove("hidden")
    this.chatPanel.classList.remove("hidden")
    this.serverUrlInput.disabled = true
    this.usernameInput.disabled = true
    this.messageInput.focus()
  }

  updateUIDisconnected() {
    this.connectBtn.classList.remove("hidden")
    this.disconnectBtn.classList.add("hidden")
    this.chatPanel.classList.add("hidden")
    this.serverUrlInput.disabled = false
    this.usernameInput.disabled = false
    this.messagesContainer.innerHTML = ""
    this.usersList.innerHTML = ""
    this.roomUsers.clear()
    this.typingUsers.clear()
  }

  setStatus(text, status) {
    this.status.textContent = text
    this.status.className = `status ${status}`
    this.status.classList.remove("hidden")
  }
}

// Initialize client
const client = new ChatClient()
