"use client"

interface User {
  id: string
  name: string
  lastSeen: string
}

interface UserListProps {
  users: User[]
  currentUserId: string
}

export function UserList({ users, currentUserId }: UserListProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 5000) return "now"
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

return (
  <div className="w-48 bg-gradient-to-b from-[#0f2626] to-[#000000] border-l border-[#1a3535] flex flex-col">
    <div className="p-4 border-b border-[#1a3535]">
      <h2 className="font-bold text-lg text-white">Active Users</h2>
      <p className="text-xs text-gray-400">{users.length} online</p>
    </div>

    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {users.length === 0 ? (
        <p className="text-xs text-gray-500">No users online</p>
      ) : (
        users.map((u) => (
          <div key={u.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#1a3535] transition-colors">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {u.name}
                {u.id === currentUserId && <span className="text-xs text-gray-400"> (you)</span>}
              </p>
              <p className="text-xs text-gray-500">{formatTime(u.lastSeen)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)
}