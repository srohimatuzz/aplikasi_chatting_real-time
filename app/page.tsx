"use client"

import { useState, useEffect } from "react"
import { supabase } from '@/lib/supabase'
import { ChatContainer } from "@/components/chat-container"
import { LoginForm } from "@/components/login-form"

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSavedUser = async () => {
    const savedUser = localStorage.getItem("chatUser")
    if (savedUser) {
      try {
          const userData = JSON.parse(savedUser)
          
          // Validate user masih ada di database
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, username')
            .eq('id', userData.id)
            .single()
          
          if (existingUser) {
            // User valid, update status online
            await supabase
              .from('users')
              .update({ 
                is_online: true,
                last_seen: new Date().toISOString()
              })
              .eq('id', userData.id)
            
            setUser(userData)
          } else {
            // User nggak ada lagi di DB, clear localStorage
            localStorage.removeItem("chatUser")
          }
        } catch (error) {
          console.error('Error validating saved user:', error)
          localStorage.removeItem("chatUser")
        }
      }
      setLoading(false)
    }

    checkSavedUser()
  }, [])

  // const handleLogin = (name: string) => {
  //   const userId = Math.random().toString(36).substr(2, 9)
  //   const newUser = { id: userId, name }
  //   setUser(newUser)
  //   localStorage.setItem("chatUser", JSON.stringify(newUser))
  // }

  // const handleLogout = () => {
  //   setUser(null)
  //   localStorage.removeItem("chatUser")
  // }

    const handleLogin = async (userData: { id: string; name: string }) => {
    try {
      // Update status online
      await supabase
        .from('users')
        .update({ 
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', userData.id)

      // Save ke state dan localStorage
      setUser(userData)
      localStorage.setItem("chatUser", JSON.stringify(userData))
      
      console.log('User logged in:', userData)
    } catch (error) {
      console.error('Login update error:', error)
    }
  }

  const handleLogout = async () => {
    if (user) {
    try {
        // Update status offline di database
        await supabase
          .from('users')
          .update({ 
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('id', user.id)
        
        console.log('User logged out:', user.name)
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    setUser(null)
    localStorage.removeItem("chatUser")
  }

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        // Update status offline saat tab/window ditutup
        await supabase
          .from('users')
          .update({ 
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('id', user.id)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [user])

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
      {!user ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <ChatContainer user={user} onLogout={handleLogout} />
      )}
    </main>
  )
}
