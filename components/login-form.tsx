"use client"

import type React from "react"
import { supabase } from '@/lib/supabase'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface LoginFormProps {
  onLogin: (user: { id: string; name: string }) => void 
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
            // is_online: true,
            // last_seen: new Date().toISOString()
            last_active: new Date().toISOString()
          })
          .eq('id', user.id)
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            username: name.trim(),
            // is_online: true,
            // last_seen: new Date().toISOString()
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-primary/10 rounded-lg mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Chat</h1>
          <p className="text-muted-foreground">Real-time messaging application</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
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
              maxLength={20}
              className="w-full"
              autoFocus
              disabled={loading} 
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 h-10"
            disabled={loading || !name.trim()}
          >
            {loading ? 'Joining...' : 'Join Chat'} 
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-semibold">Tip:</span> Open multiple tabs or browser windows to test messaging with
            different users
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200">🔧 Dev Mode:</p>
            <p className="text-yellow-700 dark:text-yellow-300">Check browser console for login status</p>
          </div>
        )}
      </Card>
    </div>
  )
}
