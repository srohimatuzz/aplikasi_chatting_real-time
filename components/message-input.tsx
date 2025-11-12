"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MessageInputProps {
  onSendMessage: (text: string) => void
  loading: boolean
}

export function MessageInput({ onSendMessage, loading }: MessageInputProps) {
  const [text, setText] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !loading) {
      onSendMessage(text)
      setText("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-card p-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          className="flex-1"
          maxLength={500}
        />
        <Button
          type="submit"
          disabled={loading || !text.trim()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
        >
          {loading ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  )
}
