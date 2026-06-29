'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { chatApi, RoomOut, MessageOut } from '@/lib/api'
import { useAuth } from './AuthContext'

export type { RoomOut as Room, MessageOut as Message }
export type RoomKind = RoomOut['kind']

interface ChatCtx {
  rooms: RoomOut[]
  activeId: number | null
  setActiveId: (id: number) => void
  messages: MessageOut[]
  loadingMessages: boolean
  sendMessage: (roomId: number, content: string) => Promise<void>
  createRoom: (data: {
    kind: string; name: string; emoji?: string; description?: string
    is_teacher_only?: boolean; member_ids?: number[]
  }) => Promise<RoomOut>
  deleteRoom: (id: number) => Promise<void>
  react: (messageId: number, emoji: string) => Promise<void>
  refreshRooms: () => Promise<void>
  emitTyping: (roomId: number, isTyping: boolean) => void
  typingUsers: Record<number, Record<number, string>>
  getDmId: (aId: string, bId: string) => string
}

const ChatContext = createContext<ChatCtx>({
  rooms: [], activeId: null, messages: [], loadingMessages: false,
  typingUsers: {},
  setActiveId: () => {}, sendMessage: async () => {},
  createRoom: async () => ({} as RoomOut), deleteRoom: async () => {},
  react: async () => {}, refreshRooms: async () => {},
  emitTyping: () => {},
  getDmId: () => '',
})

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<RoomOut[]>([])
  const [activeId, setActiveIdState] = useState<number | null>(null)
  const [messages, setMessages] = useState<MessageOut[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<number, Record<number, string>>>({})
  const socketRef = useRef<Socket | null>(null)
  const activeIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('harang_token')
    if (!token) return

    const socket = io(BASE, { auth: { token }, transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', async () => {
      console.log('🔌 Socket connected')
      if (activeIdRef.current) {
        socket.emit('room:join', activeIdRef.current)
      }
    })

    // 실시간 메시지 수신
    socket.on('message:receive', (msg: MessageOut) => {
      if (msg.room_id === activeIdRef.current) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
      setRooms(prev => prev.map(r =>
        r.id === msg.room_id
          ? {
              ...r,
              last_message: msg.content.slice(0, 40),
              last_time: new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
              unread: r.id === activeIdRef.current ? 0 : r.unread + 1,
            }
          : r
      ))
    })

    // 읽음 처리 수신 — 해당 메시지만 read_by 업데이트
    socket.on('message:read', ({ room_id, user_id, user_name, message_ids }: { room_id: number; user_id: number; user_name: string; message_ids?: number[] }) => {
      if (room_id === activeIdRef.current) {
        const readSet = new Set(message_ids ?? [])
        setMessages(prev => prev.map(m => {
          // message_ids 있으면 해당 메시지만, 없으면 전체
          if (message_ids && !readSet.has(m.id)) return m
          if (m.read_by?.some((r: any) => r.user_id === user_id)) return m
          return {
            ...m,
            read_by: [...(m.read_by ?? []), { user_id, user_name, read_at: new Date().toISOString() }],
            read_count: (m.read_count ?? 0) + 1,
          }
        }))
      }
      setRooms(prev => prev.map(r =>
        r.id === room_id ? { ...r, unread: 0 } : r
      ))
    })

    socket.on('typing:user', ({ userId, userName, roomId }: { userId: number; userName: string; roomId: number }) => {
      setTypingUsers(prev => ({
        ...prev,
        [roomId]: { ...(prev[roomId] || {}), [userId]: userName },
      }))
    })
    socket.on('typing:stop', ({ userId, roomId }: { userId: number; roomId: number }) => {
      setTypingUsers(prev => {
        const room = { ...(prev[roomId] || {}) }
        delete room[userId]
        return { ...prev, [roomId]: room }
      })
    })

    socket.on('disconnect', () => console.log('🔌 Socket disconnected'))

    return () => { socket.disconnect(); socketRef.current = null }
  }, [user?._apiId])

  const refreshRooms = useCallback(async () => {
    if (!user) return
    try {
      const data = await chatApi.getRooms()
      setRooms(data)
      if (!activeIdRef.current && data.length > 0) {
        const firstId = data[0].id
        setActiveIdState(firstId)
        activeIdRef.current = firstId
        // 소켓 연결됐을 때만 emit, 아니면 connect 이벤트에서 처리
        if (socketRef.current?.connected) {
          socketRef.current.emit('room:join', firstId)
        }
      }
    } catch { }
  }, [user])

  useEffect(() => { refreshRooms() }, [user])

  const loadMessages = useCallback(async (roomId: number) => {
    setLoadingMessages(true)
    try {
      const data = await chatApi.getMessages(roomId)
      setMessages(data)
    } catch { setMessages([]) }
    finally { setLoadingMessages(false) }
  }, [])

  const setActiveId = useCallback((id: number) => {
    if (activeIdRef.current && activeIdRef.current !== id) {
      socketRef.current?.emit('room:leave', activeIdRef.current)
    }
    setActiveIdState(id)
    activeIdRef.current = id
    socketRef.current?.emit('room:join', id)
    loadMessages(id)
    setRooms(prev => prev.map(r => r.id === id ? { ...r, unread: 0 } : r))
  }, [loadMessages])

  const sendMessage = useCallback(async (roomId: number, content: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:send', { roomId, content })
    } else {
      const msg = await chatApi.sendMessage(roomId, content)
      setMessages(prev => [...prev, msg])
      setRooms(prev => prev.map(r =>
        r.id === roomId
          ? { ...r, last_message: content.slice(0, 40), last_time: new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) }
          : r
      ))
    }
  }, [])

  const createRoom = useCallback(async (data: Parameters<ChatCtx['createRoom']>[0]) => {
    const room = await chatApi.createRoom(data)
    setRooms(prev => prev.find(r => r.id === room.id) ? prev : [...prev, room])
    setActiveId(room.id)
    return room
  }, [setActiveId])

  const deleteRoom = useCallback(async (id: number) => {
    await chatApi.deleteRoom(id)
    setRooms(prev => prev.filter(r => r.id !== id))
    if (activeIdRef.current === id) {
      const remaining = rooms.filter(r => r.id !== id)
      if (remaining.length > 0) setActiveId(remaining[0].id)
      else { setActiveIdState(null); activeIdRef.current = null; setMessages([]) }
    }
  }, [rooms, setActiveId])

  const react = useCallback(async (messageId: number, emoji: string) => {
    await chatApi.react(messageId, emoji)
    if (activeIdRef.current) await loadMessages(activeIdRef.current)
  }, [loadMessages])

  const emitTyping = useCallback((roomId: number, isTyping: boolean) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit(isTyping ? 'typing:start' : 'typing:stop', roomId)
  }, [])

  const getDmId = (aId: string, bId: string) => `dm_${[aId, bId].sort().join('_')}`

  return (
    <ChatContext.Provider value={{
      rooms, activeId, messages, loadingMessages, typingUsers,
      setActiveId, sendMessage, createRoom, deleteRoom, react,
      refreshRooms, emitTyping, getDmId,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() { return useContext(ChatContext) }