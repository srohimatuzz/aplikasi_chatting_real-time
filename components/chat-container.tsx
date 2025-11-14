"use client"

import { supabase } from '@/lib/supabase'
import { useState, useEffect } from "react"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { UserList } from "./user-list"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  user_id: string
  room_id: string
  username: string
  content: string
  created_at: string
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

  // const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // const pollMessages = async () => {
  //   try {
  //     const response = await fetch(`/api/messages?room=${room}`)
  //     const data = await response.json()
  //     if (data.success) {
  //       setMessages(data.messages || [])
  //       setUsers(data.users || [])
  //     }
  //   } catch (error) {
  //     console.error("[v0] Poll error:", error)
  //   }
  // }

  // // Initial load and setup polling
  // useEffect(() => {
  //   pollMessages()
  //   pollIntervalRef.current = setInterval(pollMessages, 1000)

  //   return () => {
  //     if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
  //   }
  // }, [room])

  // // Register user on join
  // useEffect(() => {
  //   const registerUser = async () => {
  //     try {
  //       await fetch("/api/users", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           userId: user.id,
  //           username: user.name,
  //           room,
  //         }),
  //       })
  //     } catch (error) {
  //       console.error("[v0] Register error:", error)
  //     }
  //   }

  //   registerUser()
  // }, [user, room])

   // Load messages dari Supabase (ganti pollMessages)
  useEffect(() => {
    loadMessages()
  }, [room])

  const loadMessages = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', room)  // Filter by room
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error loading messages:', error)
      } else {
        console.log('Messages loaded:', data)
        setMessages(data || [])
      }
    } catch (error) {
      console.error('Load messages error:', error)
    } finally {
      setLoading(false)
    }
  }

  //  Real-time subscription (ganti polling interval)
  useEffect(() => {
    const channel = supabase
      .channel(`room-${room}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room}`
        },
        (payload) => {
          console.log('New message received:', payload.new)
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    // Cleanup saat unmount atau room berubah
    return () => {
      supabase.removeChannel(channel)
    }
  }, [room])

  // Load users dari Supabase (opsional)
  useEffect(() => {
    loadUsers()
  }, [room])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('online_users')  // Sesuaikan dengan nama tabel kamu
        .select('*')
        .eq('room_id', room)   // Filter by room
        .eq('is_online', true)

        if (error) {
        console.error('Error loading users:', error)
        return
      }

      console.log('Users loaded:', data)
      
      const transformedUsers = data?.map(u => ({
        id: u.user_id,
        name: u.username,
        lastSeen: u.last_seen
      })) || []
      
      console.log('Transformed users:', transformedUsers)
      setUsers(transformedUsers)
    } catch (error) {
      console.error('Load users error:', error)
    }
  }

    // Load users on mount and room change
  useEffect(() => {
    loadUsers()
  }, [room])
      
  
  // Real-time subscription untuk online_users
  useEffect(() => {
    const userChannel = supabase
      .channel(`users-${room}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_users',
          filter: `room_id=eq.${room}`
        },
        (payload) => {
          console.log('🔔 Online users changed:', payload)
          loadUsers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(userChannel)
    }
  }, [room])


  //     if (error) {
  //       console.error('Error loading users:', error)
  //     } else {
  //       // Transform data ke format User
  //       const transformedUsers = data?.map(u => ({
  //         id: u.id,
  //         name: u.username || u.name,
  //         lastSeen: u.last_seen || u.updated_at
  //       })) || []
  //       setUsers(transformedUsers)
  //     }
  //   } catch (error) {
  //     console.error('Load users error:', error)
  //   }
  // }

  // const handleSendMessage = async (text: string) => {
  //   if (!text.trim()) return

  //   setLoading(true)
  //   try {
  //     const response = await fetch("/api/messages", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         userId: user.id,
  //         username: user.name,
  //         text: text.trim(),
  //         room,
  //       }),
  //     })

  //     if (response.ok) {
  //       await pollMessages()
  //     }
  //   } catch (error) {
  //     console.error("[v0] Send error:", error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const handleLogout = () => {
  //   if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
  //   onLogout()
  // }


    //  Real-time subscription untuk online_users
  // useEffect(() => {
  //   const userChannel = supabase
  //     .channel(`users-${room}`)
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'online_users',
  //         filter: `room_id=eq.${room}`
  //       },

  //       () => {
  //         console.log('Online users changed, reloading...')
  //         loadUsers()
  //       }
  //     )
  //     .subscribe()

  //   return () => {
  //     supabase.removeChannel(userChannel)
  //   }
  // }, [room])

  //  //  Send message langsung ke Supabase (hapus fetch ke API)
  // const handleSendMessage = async (text: string) => {
  //   if (!text.trim()) return

  //   setLoading(true)
  //   try {
  //     const { data, error } = await supabase
  //       .from('messages')
  //       .insert({
  //         user_id: user.id,
  //         room_id: room,
  //         username: user.name,
  //         content: text.trim(),  
  //         created_at: new Date().toISOString()
  //       })
  //       .select()
      
  //     if (error) {
  //       console.error('Error sending message:', error)
  //       alert('Gagal mengirim pesan!')
  //     } else {
  //       console.log('Message sent:', data)
  //       // Pesan akan otomatis muncul via real-time subscription
  //     }
  //   } catch (error) {
  //     console.error('Send message error:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // // Update user status saat join (opsional)
  // useEffect(() => {
  //   const updateUserStatus = async () => {
  //     try {
  //       console.log('Updating user status for room:', room)

  //       // Cek apakah user sudah ada
  //       const { data: existingUser } = await supabase
  //         .from('online_users')
  //         .select('*')
  //         .eq('user_id', user.id)
  //         .eq('room_id', room)
  //         .maybeSingle()

  //       if (existingUser) {
  //         // Update existing user
  //         const { error } = await supabase
  //           .from('online_users')
  //           .update({
  //             is_online: true,
  //             last_seen: new Date().toISOString()
  //           })
  //           .eq('id', existingUser.id)

  //           if (error) console.error('Error updating user:', error)
  //         else console.log('User updated')
  //       } else {
  //         // Insert new user
  //         const { error } = await supabase
  //           .from('online_users')
  //           .insert({
  //             user_id: user.id,
  //             username: user.name,
  //             room_id: room,
  //             is_online: true,
  //             last_seen: new Date().toISOString()
  //           })

  //       if (error) console.error('Error inserting user:', error)
  //         else console.log('User inserted')
  //       }

  //       // Reload users after update
  //       await loadUsers()
  //     } catch (error) {
  //       console.error('Error updating user status:', error)
  //     }
  //   }

  //   updateUserStatus()

  // Send message langsung ke Supabase
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          room_id: room,
          username: user.name,
          content: text.trim(),
          created_at: new Date().toISOString()
        })
        .select()
      
      if (error) {
        console.error('Error sending message:', error)
        alert('Gagal mengirim pesan!')
      } else {
        console.log('Message sent:', data)
      }
    } catch (error) {
      console.error('Send message error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update user status saat join room
useEffect(() => {
  const updateUserStatus = async () => {
    try {
      console.log('Updating user status for room:', room)
      
      // Gunakan UPSERT dengan on_conflict
      const { data, error } = await supabase
        .from('online_users')
        .upsert({
          user_id: user.id,
          username: user.name,
          room_id: room,
          is_online: true,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id,room_id',  // Conflict resolution
          ignoreDuplicates: false  // Update jika sudah ada
        })
        .select()
      
      if (error) {
        console.error('Error upserting user:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      } else {
        console.log('User upserted:', data)
      }

      // Reload users after update
      await loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  updateUserStatus()

      // Update presence setiap 30 detik
    const presenceInterval = setInterval(() => {
      supabase
        .from('online_users')
        .update({ 
          last_seen: new Date().toISOString(),
          is_online: true 
        })
        .eq('user_id', user.id)
        .eq('room_id', room)
    }, 30000)

     // Cleanup saat pindah room atau unmount
    return () => {
      clearInterval(presenceInterval)
      
      supabase
        .from('online_users')
        .update({ is_online: false })
        .eq('user_id', user.id)
        .eq('room_id', room)
        .then(() => console.log('👋 User set offline'))
    }
  }, [user.id, user.name, room])

  const handleLogout = async () => {
    console.log('🚪 Logging out...')
    
    // Update semua user status ke offline
    await supabase
      .from('online_users')
      .update({ is_online: false })
      .eq('user_id', user.id)
    
    onLogout()
  }

  //   // Cleanup saat logout
  //   return () => {
  //     supabase
  //       .from('online_users')
  //       .update({ is_online: false })
  //       .eq('user_id', user.id)
  //       .eq('room_id', room)
  //       .then(() => console.log('User set offline'))
  //   }
  // }, [user.id, user.name, room])

  // const handleLogout = async () => {
  //   // Update user status ke offline
  //   await supabase
  //     .from('online_users')
  //     .update({ is_online: false })
  //     .eq('user_id', user.id)
    
  //   onLogout()
  // }

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
              <p className="text-xs text-muted-foreground">Real-time via Supabase</p>
              <p className="text-xs font-mono text-primary">Connected ✅</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {loading && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : (
          <MessageList messages={messages} currentUserId={user.id} />
        )}

        {/* Input */}
        <MessageInput onSendMessage={handleSendMessage} loading={loading} />
      </div>

      {/* Users Sidebar */}
      <UserList users={users} currentUserId={user.id} />
    </div>
  )
}
