"use client"

import { useEffect, useRef } from "react"

interface Message {
  id: string
  user_id: string
  room_id: string
  username: string
  content: string
  created_at: string
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
      return date.toLocaleTimeString("id-ID", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false, 
      timeZone: "Asia/Jakarta"
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Reset time to compare dates only
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "Hari ini"
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return "Kemarin"
    } else {
      return date.toLocaleDateString("id-ID", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })
    }
  }

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true

    const currentDate = new Date(currentMsg.created_at).toDateString()
    const prevDate = new Date(prevMsg.created_at).toDateString()

    return currentDate !== prevDate
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-[#0a1a1a] via-[#0d1f1f] to-[#0f2424]">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-400 text-lg">No messages yet</p>
            <p className="text-gray-500 text-sm">Start a conversation</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg, index) => {
            const isCurrentUser = msg.user_id === currentUserId
            const prevMsg = index > 0 ? messages[index - 1] : null
            const showDateSeparator = shouldShowDateSeparator(msg, prevMsg)

            return (
              <div key={msg.id}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-6">
                    <div className="flex-1 border-t border-gray-700"></div>
                    <div className="px-4 py-1 bg-[#1a3535] rounded-full border border-gray-700">
                      <p className="text-xs font-semibold text-gray-400">
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                    <div className="flex-1 border-t border-gray-700"></div>
                  </div>
                )}

                {/* Message */}
                <div
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`max-w-xs lg:max-w-md`}>
                    {!isCurrentUser && (
                      <p className="text-xs font-semibold text-gray-400 mb-1 px-2">{msg.username}</p>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? "bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-br-none shadow-lg"
                          : "bg-gradient-to-br from-[#1a3535] to-[#081414] text-gray-200 rounded-bl-none shadow-lg border border-[#2a4545]/30"
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                    </div>
                    <p className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? "text-right" : ""}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </>
      )}
    </div>
  )
}
