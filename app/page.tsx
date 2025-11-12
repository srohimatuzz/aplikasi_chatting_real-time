"use client"

import { useState, useEffect } from "react"
import { ChatContainer } from "@/components/chat-container"
import { LoginForm } from "@/components/login-form"

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("chatUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (name: string) => {
    const userId = Math.random().toString(36).substr(2, 9)
    const newUser = { id: userId, name }
    setUser(newUser)
    localStorage.setItem("chatUser", JSON.stringify(newUser))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("chatUser")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {!user ? <LoginForm onLogin={handleLogin} /> : <ChatContainer user={user} onLogout={handleLogout} />}
    </main>
  )
}
