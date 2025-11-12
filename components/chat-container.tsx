"use client"

import { useState, useEffect, useRef } from "react"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { UserList } from "./user-list"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  userId: string
  username: string
  text: string
  timestamp: string
}

interface User {
  id: string
  name: string
  lastSeen: string
}

interface ChatContainerProps {
  user: { id: string; name: string }
  onLogout: () => void
}

export function ChatContainer({ user, onLogout }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [room, setRoom] = useState("general")
  const [loading, setLoading] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const pollMessages = async () => {
    try {
      const response = await fetch(`/api/messages?room=${room}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages || [])
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("[v0] Poll error:", error)
    }
  }

  // Initial load and setup polling
  useEffect(() => {
    pollMessages()
    pollIntervalRef.current = setInterval(pollMessages, 1000)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [room])

  // Register user on join
  useEffect(() => {
    const registerUser = async () => {
      try {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            username: user.name,
            room,
          }),
        })
      } catch (error) {
        console.error("[v0] Register error:", error)
      }
    }

    registerUser()
  }, [user, room])

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          username: user.name,
          text: text.trim(),
          room,
        }),
      })

      if (response.ok) {
        await pollMessages()
      }
    } catch (error) {
      console.error("[v0] Send error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    onLogout()
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">Chat Rooms</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {["general", "tech", "random", "gaming"].map((r) => (
            <button
              key={r}
              onClick={() => setRoom(r)}
              className={`w-full px-4 py-2 rounded-lg text-left font-medium transition-colors ${
                room === r ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              #{r}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <div className="bg-muted rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Current User</p>
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">#{room}</h1>
              <p className="text-sm text-muted-foreground">
                {users.length} {users.length === 1 ? "user" : "users"} online
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Monitor with Wireshark</p>
              <p className="text-xs font-mono text-primary">ws://localhost:3000</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <MessageList messages={messages} currentUserId={user.id} />

        {/* Input */}
        <MessageInput onSendMessage={handleSendMessage} loading={loading} />
      </div>

      {/* Users Sidebar */}
      <UserList users={users} currentUserId={user.id} />
    </div>
  )
}
