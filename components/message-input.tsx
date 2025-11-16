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
  <form onSubmit={handleSubmit} className="border-t border-[#1a3535] bg-gradient-to-b from-[#0f2626] to-[#0a1e1e] p-4">
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
        className="flex-1 bg-[#1a3535] border-[#2a4545] text-white placeholder:text-gray-500"
        maxLength={500}
      />
      <Button
        type="submit"
        disabled={loading || !text.trim()}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
      >
        {loading ? "Sending..." : "Send"}
      </Button>
    </div>
  </form>
)
}