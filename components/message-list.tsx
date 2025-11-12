"use client"

import { useEffect, useRef } from "react"

interface Message {
  id: string
  userId: string
  username: string
  text: string
  timestamp: string
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
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground text-lg">No messages yet</p>
            <p className="text-muted-foreground text-sm">Start a conversation</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg) => {
            const isCurrentUser = msg.userId === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`max-w-xs lg:max-w-md`}>
                  {!isCurrentUser && (
                    <p className="text-xs font-semibold text-muted-foreground mb-1 px-2">{msg.username}</p>
                  )}
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.text}</p>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? "text-right" : ""}`}>
                    {formatTime(msg.timestamp)}
                  </p>
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
