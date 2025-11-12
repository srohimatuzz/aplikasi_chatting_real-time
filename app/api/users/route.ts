import { type NextRequest, NextResponse } from "next/server"

const usersStore: { [key: string]: any[] } = {
  general: [],
  tech: [],
  random: [],
  gaming: [],
}

export async function POST(request: NextRequest) {
  try {
    const { userId, username, room } = await request.json()

    if (!userId || !username || !room) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!usersStore[room]) usersStore[room] = []

    // Update or add user
    const existingIndex = usersStore[room].findIndex((u) => u.id === userId)
    const userData = {
      id: userId,
      name: username,
      lastSeen: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      usersStore[room][existingIndex] = userData
    } else {
      usersStore[room].push(userData)
      console.log(`[USER] ${username} joined ${room}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] User error:", error)
    return NextResponse.json({ success: false, error: "Failed to register user" }, { status: 500 })
  }
}
