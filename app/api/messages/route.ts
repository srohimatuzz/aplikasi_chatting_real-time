import { type NextRequest, NextResponse } from "next/server"

const messageStore: { [key: string]: any[] } = {
  general: [],
  tech: [],
  random: [],
  gaming: [],
}

const usersStore: { [key: string]: any[] } = {
  general: [],
  tech: [],
  random: [],
  gaming: [],
}

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get("room") || "general"

  // Cleanup old users (older than 30 seconds)
  const now = new Date()
  if (usersStore[room]) {
    usersStore[room] = usersStore[room].filter((u) => {
      const lastSeen = new Date(u.lastSeen)
      return now.getTime() - lastSeen.getTime() < 30000
    })
  }

  return NextResponse.json({
    success: true,
    messages: messageStore[room] || [],
    users: usersStore[room] || [],
  })
}

export async function POST(request: NextRequest) {
  try {
    const { userId, username, text, room } = await request.json()

    if (!text || !username || !userId || !room) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username,
      text,
      timestamp: new Date().toISOString(),
    }

    if (!messageStore[room]) messageStore[room] = []
    messageStore[room].push(message)

    // Keep only last 100 messages per room
    if (messageStore[room].length > 100) {
      messageStore[room] = messageStore[room].slice(-100)
    }

    console.log(`[CHAT] ${username} -> ${room}: ${text}`)

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("[API] POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}
