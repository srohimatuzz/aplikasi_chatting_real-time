"use client"

import { supabase } from '@/lib/supabase'
import { useState, useEffect } from "react"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { UserList } from "./user-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

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

interface ChatRoom {
  id: string
  name: string
  description: string
  created_at: string
}

interface ChatContainerProps {
  user: { id: string; name: string }
  onLogout: () => void
}

export function ChatContainer({ user, onLogout }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [room, setRoom] = useState("general")
  const [loading, setLoading] = useState(false)

  // State for create room dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomDescription, setNewRoomDescription] = useState("")
  const [createRoomLoading, setCreateRoomLoading] = useState(false)

  // Load rooms from database
  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error loading rooms:', error)
      } else {
        console.log('Rooms loaded:', data)
        setRooms(data || [])
      }
    } catch (error) {
      console.error('Load rooms error:', error)
    }
  }

  // Create new room
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      alert('Room name is required!')
      return
    }

    // Validate room name (only lowercase, no spaces)
    const roomName = newRoomName.trim().toLowerCase().replace(/\s+/g, '-')
    
    if (!/^[a-z0-9-]+$/.test(roomName)) {
      alert('Room name can only contain lowercase letters, numbers, and hyphens')
      return
    }

    setCreateRoomLoading(true)
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomName,
          description: newRoomDescription.trim() || null,
          created_at: new Date().toISOString()
        })
        .select()
      
      if (error) {
        console.error('Error creating room:', error)
        if (error.code === '23505') { // Unique violation
          alert('Room name already exists!')
        } else {
          alert('Failed to create room. Please try again.')
        }
      } else {
        console.log('Room created:', data)
        // Reload rooms
        await loadRooms()
        // Switch to new room
        setRoom(roomName)
        // Close dialog and reset form
        setIsDialogOpen(false)
        setNewRoomName("")
        setNewRoomDescription("")
      }
    } catch (error) {
      console.error('Create room error:', error)
      alert('An unexpected error occurred')
    } finally {
      setCreateRoomLoading(false)
    }
  }

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
        .eq('room_id', room)  
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
      .on('postgres_changes',
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

  //   // Load users on mount and room change
  // useEffect(() => {
  //   loadUsers()
  // }, [room])
  
  // Real-time subscription untuk online_users
  useEffect(() => {
    const userChannel = supabase
      .channel(`users-${room}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_users',
          filter: `room_id=eq.${room}`
        },
        (payload) => {
          console.log('Online users changed:', payload)
          loadUsers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(userChannel)
    }
  }, [room])

  // Send message langsung ke Supabase
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    setLoading(true)
    try {
      // Konversi waktu lokal ke format ISO dengan offset WIB
      const now = new Date()
      const wibOffset = 7 * 60 // WIB is UTC+7 in minutes
      const wibTime = new Date(now.getTime() + (wibOffset * 60 * 1000))
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          room_id: room,
          username: user.name,
          content: text.trim(),
          created_at: wibTime.toISOString()
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
        .then(() => console.log('User set offline'))
    }
  }, [user.id, user.name, room])

  const handleLogout = async () => {
    console.log('Logging out...')
    
    // Update semua user status ke offline
    await supabase
      .from('online_users')
      .update({ is_online: false })
      .eq('user_id', user.id)
    
    onLogout()
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a1a1a] via-[#0d1f1f] to-[#0f2424]">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-[#0f2626] to-[#000000] border-r border-[#1a3535] flex flex-col">
        <div className="p-4 border-b border-[#1a3535] flex items-center justify-between">
          <h2 className="font-bold text-lg text-white">Chat Rooms</h2>
          
          {/* Create Room Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f2626] border-[#1a3535] text-white">
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Room Name *
                  </label>
                  <Input
                    placeholder="e.g. gaming, tech-support"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="bg-[#1a3535] border-gray-700 text-white"
                    maxLength={30}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only lowercase letters, numbers, and hyphens
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Description (optional)
                  </label>
                  <Input
                    placeholder="What is this room about?"
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    className="bg-[#1a3535] border-gray-700 text-white"
                    maxLength={100}
                  />
                </div>
                <Button
                  onClick={handleCreateRoom}
                  disabled={createRoomLoading || !newRoomName.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {createRoomLoading ? 'Creating...' : 'Create Room'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rooms.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No rooms yet</p>
          ) : (
            rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => setRoom(r.name)}
                className={`w-full px-4 py-2 rounded-lg text-left font-medium transition-colors ${
                  room === r.name 
                    ? "bg-emerald-600 text-white" 
                    : "bg-[#0a1e1e] text-gray-300 hover:bg-[#1a3535]"
                }`}
                title={r.description || undefined}
              >
                <div className="flex items-center justify-between">
                  <span>#{r.name}</span>
                </div>
                {r.description && (
                  <p className="text-xs text-gray-400 truncate mt-1">
                    {r.description}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[#1a3535]">
          <div className="bg-[#1a3535] rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-400 font-semibold mb-1">Current User</p>
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#0f2626] to-[#0a1e1e] border-b border-[#1a3535] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">#{room}</h1>
              <p className="text-sm text-gray-400">
                {users.length} {users.length === 1 ? "user" : "users"} online
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Real-time chat</p>
              <p className="text-xs font-mono text-emerald-500">Connected ✅</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {loading && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">Loading messages...</p>
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