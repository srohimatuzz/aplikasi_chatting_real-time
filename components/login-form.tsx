"use client"

import type React from "react"
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface LoginFormProps {
  onLogin: (user: { id: string; name: string }) => void 
}

// Komponen untuk bola animasi
const AnimatedBall = ({ delay = 0 }) => {
  const [position, setPosition] = useState({
    x: Math.random() * 100,
    y: Math.random() * 100
  })

  useEffect(() => {
    const duration = 5000 + Math.random() * 2000
    
    const animate = () => {
      setPosition({
        x: Math.random() * 100,
        y: Math.random() * 100
      })
    }

    const timer = setTimeout(() => {
      animate()
      const interval = setInterval(animate, duration)
      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const size = 200 + Math.random() * 300

  return (
    <div
      className="absolute rounded-full blur-3xl opacity-30"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.6) 50%, transparent 70%)`,
        transition: `all ${5000 + Math.random() * 2000}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        transform: 'translate(-50%, -50%)'
      }}
    />
  )
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Please enter your name")
      return
    }
    if (name.length > 20) {
      setError("Name must be less than 20 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      // mengecek apakah user sudah ada di database
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('username', name.trim())
      
      if (checkError) {
        console.error('Error checking user:', checkError)
        setError('Database error. Please try again.')
        setLoading(false)
        return
      }

      let user

      if (existingUsers && existingUsers.length > 0) {
        user = existingUsers[0]
        console.log('Existing user found:', user)
        
        // Update status online (opsional)
        await supabase
          .from('users')
          .update({ 
            last_active: new Date().toISOString()
          })
          .eq('id', user.id)
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            username: name.trim(),
            last_active: new Date().toISOString()
          })
          .select()
          .single()
        
        if (insertError) {
          console.error('Error creating user:', insertError)
          setError('Failed to create user. Please try again.')
          setLoading(false)
          return
        }

        user = newUser
        console.log('New user created:', user)
      }

      onLogin({
        id: user.id,
        name: user.username
      })

    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && !loading) {
      handleSubmit(e as any)
    }
  }

return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Animated Background Balls */}
      <AnimatedBall delay={0} />
      <AnimatedBall delay={1000} />
      <AnimatedBall delay={2000} />
      <AnimatedBall delay={3000} />
      <AnimatedBall delay={4000} />

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-md p-8 shadow-2xl bg-gradient-to-b from-[#0f2626] to-[#000000] border-r border-[#1a3535] backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-emerald-600/20 rounded-lg mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Chat</h1>
          <p className="text-gray-400">Real-time messaging application</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
              Your Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              onKeyPress={handleKeyPress}
              maxLength={20}
              className="w-full bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
              autoFocus
              disabled={loading} 
            />
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 h-10"
            disabled={loading || !name.trim()}
          >
            {loading ? 'Joining...' : 'Join Chat'} 
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            <span className="font-semibold">Tip:</span> Open multiple tabs or browser windows to test messaging with
            different users
          </p>
        </div>

        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded text-xs">
          <p className="font-semibold text-yellow-400">🔧 Dev Mode:</p>
          <p className="text-yellow-500">Check browser console for login status</p>
        </div>
      </Card>
    </div>
  )
}

export default LoginForm