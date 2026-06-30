'use client'
import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import { RoomOut, MessageOut, UserOut, usersApi } from '@/lib/api'
import { getMediaUrl } from '@/lib/config'
import { Send, Plus, Trash2, Lock, Users, Search, Check, Edit3, Hash } from 'lucide-react'

/* ─────────────────────────────────────────
   공통 헬퍼 컴포넌트
───────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#1a7a6e' : '#e2e8e6', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

function ModalBox({ title, sub, onClose, width, children }: { title: string; sub?: string; onClose: () => void; width: number; children: React.ReactNode }) {
  return (
    <div style={{ width, background: 'var(--bg-card)', borderRadius: 16, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          {title && <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>}
          {sub && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</p>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(26,122,110,0.5)', letterSpacing: 0.8, textTransform: 'uppercase' as const, padding: '6px 20px 4px', marginTop: 4 }}>
      {label}
    </div>
  )
}

function ActionBtn({ icon, title, onClick, color }: { icon: React.ReactNode; title: string; onClick: () => void; color?: string }) {
  return (
    <button title={title} onClick={onClick} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color || '#3d5a56' }}>
      {icon}
    </button>
  )
}

type ChatUser = UserOut

function PersonRow({ user, right, selected, onClick }: { user: ChatUser; right?: React.ReactNode; selected?: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', background: selected ? '#f0f9f7' : 'white', transition: 'background 0.15s' }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#f8fbfa' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = selected ? '#f0f9f7' : 'white' }}
    >
      {user.profile_image ? <img src={getMediaUrl(user.profile_image) || ''} alt="프로필" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 34, height: 34, borderRadius: '50%', background: user.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>{user.avatar_text}</div>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.role === 'student' ? `${user.grade}학년 ${user.class_num}반` : user.subject}</div>
      </div>
      {right}
    </div>
  )
}

/* ─────────────────────────────────────────
   채팅방 목록 아이템
───────────────────────────────────────── */
function RoomItem({ room, active, myApiId, isTeacher, allUsers, onClick, onDelete }: {
  room: RoomOut; active: boolean; myApiId: number; isTeacher: boolean
  allUsers: UserOut[]
  onClick: () => void; onDelete?: () => void
}) {
  const [hov, setHov] = useState(false)
  const isDm = room.kind === 'dm'
  const otherUserId = isDm ? room.member_ids.find((id: number) => id !== myApiId) : null
  const otherUser = otherUserId ? allUsers.find(u => u.id === otherUserId) : null

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', margin: '1px 6px', borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s', background: active ? '#e8f5f3' : hov ? '#f3f7f6' : 'transparent', borderLeft: `3px solid ${active ? '#1a7a6e' : 'transparent'}` }}
    >
      {isDm && otherUser
        ? (otherUser.profile_image ? <img src={getMediaUrl(otherUser.profile_image) || ''} alt="프로필" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 30, height: 30, borderRadius: '50%', background: otherUser.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: otherUser.avatar_text.length > 1 ? 10 : 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>{otherUser.avatar_text}</div>)
        : <span style={{ fontSize: 18, flexShrink: 0 }}>{room.emoji}</span>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#1a7a6e' : '#1a2e2b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isDm && otherUser ? otherUser.name : room.name}
          </span>
          {room.is_teacher_only && !isTeacher && <Lock size={10} color="#aab8b5" />}
        </div>
        {room.last_message && <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{room.last_message}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        {room.last_time && !room.unread && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{room.last_time}</span>}
        {room.unread > 0 && !active && <span style={{ background: '#f97316', color: 'white', borderRadius: 8, fontSize: 10, fontWeight: 700, padding: '1px 5px' }}>{room.unread}</span>}
        {hov && onDelete && (
          <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ width: 20, height: 20, border: 'none', background: '#fef2f2', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <Trash2 size={10} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   모달: DM 시작
───────────────────────────────────────── */
function NewDmModal({ myApiId, existingRooms, allUsers, onClose, onOpen }: {
  myApiId: number; existingRooms: RoomOut[]; allUsers: UserOut[]; onClose: () => void; onOpen: (target: ChatUser) => void
}) {
  const [q, setQ] = useState('')
  const others = allUsers.filter(u => u.id !== myApiId)
  const filtered = others.filter(u => u.name.includes(q))

  return (
    <Overlay onClose={onClose}>
      <ModalBox title="새 메시지" sub="1:1 대화를 시작할 상대를 선택하세요" onClose={onClose} width={440}>
        <div className="search-bar" style={{ marginBottom: 14 }}>
          <Search size={14} color="#aab8b5" />
          <input placeholder="이름 검색..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 340, overflow: 'auto' }}>
          {filtered.map(u => {
            const already = existingRooms.some(r => r.kind === 'dm' && r.member_ids.includes(u.id))
            return (
              <PersonRow key={u.id} user={u}
                right={already
                  ? <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>대화 중</span>
                  : <span style={{ fontSize: 11, color: '#1a7a6e', fontWeight: 700 }}>대화 시작</span>
                }
                onClick={() => { onOpen(u); onClose() }}
              />
            )
          })}
        </div>
      </ModalBox>
    </Overlay>
  )
}

/* ─────────────────────────────────────────
   모달: 그룹 채팅방 만들기
───────────────────────────────────────── */
const GROUP_EMOJIS = ['💬', '🛠️', '📐', '🎮', '📚', '🎨', '🏃', '🌟', '🔬', '🎯']

function NewGroupModal({ myApiId, isTeacher, allUsers, onClose, onCreate }: {
  myApiId: number; isTeacher: boolean; allUsers: UserOut[]; onClose: () => void
  onCreate: (name: string, emoji: string, memberIds: number[], teacherOnly: boolean) => void
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💬')
  const [selected, setSelected] = useState<number[]>([myApiId])
  const [teacherOnly, setTeacherOnly] = useState(false)
  const [q, setQ] = useState('')
  const others = allUsers.filter(u => u.id !== myApiId)
  const filtered = others.filter(u => u.name.includes(q))
  const toggle = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <Overlay onClose={onClose}>
      <ModalBox title="그룹 채팅방 만들기" sub="함께 대화할 친구나 선생님을 초대하세요" onClose={onClose} width={520}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>채팅방 이름 *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ width: 44, height: 44, background: 'var(--bg)', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 22, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{emoji}</button>
            <input className="input" placeholder="채팅방 이름 입력..." value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {GROUP_EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} style={{ width: 34, height: 34, border: `2px solid ${emoji === e ? '#1a7a6e' : '#e2e8e6'}`, background: emoji === e ? '#e8f5f3' : 'white', borderRadius: 8, fontSize: 18, cursor: 'pointer' }}>{e}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            멤버 초대 <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>({selected.length}명 선택됨)</span>
          </label>
          <div className="search-bar" style={{ marginBottom: 8 }}>
            <Search size={14} color="#aab8b5" />
            <input placeholder="이름 검색..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 220, overflow: 'auto', border: '1.5px solid var(--border)', borderRadius: 10, padding: '6px 0' }}>
            {filtered.map(u => (
              <PersonRow key={u.id} user={u} selected={selected.includes(u.id)}
                right={
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${selected.includes(u.id) ? '#1a7a6e' : '#e2e8e6'}`, background: selected.includes(u.id) ? '#1a7a6e' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selected.includes(u.id) && <Check size={12} color="white" />}
                  </div>
                }
                onClick={() => toggle(u.id)}
              />
            ))}
          </div>
        </div>
        {isTeacher && (
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: 10, border: '1px solid #e2e8e6' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={13} color="#1a7a6e" /> 선생님만 글쓰기</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>학생은 읽기만 가능합니다</div>
            </div>
            <Toggle on={teacherOnly} onChange={() => setTeacherOnly(!teacherOnly)} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px 0' }}>취소</button>
          <button
            onClick={() => { if (!name.trim() || selected.length < 2) return; onCreate(name.trim(), emoji, selected, teacherOnly); onClose() }}
            disabled={!name.trim() || selected.length < 2}
            className="btn btn-primary"
            style={{ flex: 2, justifyContent: 'center', padding: '12px 0', opacity: (!name.trim() || selected.length < 2) ? 0.45 : 1 }}
          >
            <Plus size={15} /> 만들기
          </button>
        </div>
      </ModalBox>
    </Overlay>
  )
}

/* ─────────────────────────────────────────
   모달: 반 채널 추가 (선생님 전용)
───────────────────────────────────────── */
const CLASS_CHANNEL_TYPES = [
  { id: 'class_free',     emoji: '💬', label: '자유',   desc: '모든 구성원이 메시지를 보낼 수 있습니다', teacherOnly: false },
  { id: 'class_question', emoji: '❓', label: '질문',   desc: '질문 및 답변 채널',                       teacherOnly: false },
  { id: 'class_notice',   emoji: '📣', label: '공지',   desc: '선생님만 글쓰기 가능',                    teacherOnly: true  },
]

function NewClassChannelModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (name: string, emoji: string, kind: RoomOut['kind'], teacherOnly: boolean) => void
}) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<RoomOut['kind']>('class_free')
  const [tOnly, setTOnly] = useState(false)
  const sel = CLASS_CHANNEL_TYPES.find(t => t.id === kind)

  return (
    <Overlay onClose={onClose}>
      <ModalBox title="반 채널 추가" sub="새 반 채널을 만듭니다 (선생님 전용)" onClose={onClose} width={460}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          {CLASS_CHANNEL_TYPES.map(t => (
            <div key={t.id} onClick={() => setKind(t.id as RoomOut['kind'])} style={{ padding: '12px 10px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${kind === t.id ? '#1a7a6e' : '#e2e8e6'}`, background: kind === t.id ? '#f0f9f7' : 'white', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 5 }}>{t.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: kind === t.id ? '#1a7a6e' : '#1a2e2b' }}>{t.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>{t.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 7 }}>채널 이름 *</label>
          <input className="input" placeholder="채널 이름 입력..." value={name} onChange={e => setName(e.target.value)} />
        </div>
        {!sel?.teacherOnly && (
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: 10, border: '1px solid #e2e8e6' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={13} color="#1a7a6e" /> 선생님만 글쓰기</div>
            <Toggle on={tOnly} onChange={() => setTOnly(!tOnly)} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px 0' }}>취소</button>
          <button
            onClick={() => { if (!name.trim()) return; onCreate(name.trim(), sel?.emoji || '💬', kind, sel?.teacherOnly || tOnly); onClose() }}
            disabled={!name.trim()}
            className="btn btn-primary"
            style={{ flex: 2, justifyContent: 'center', padding: '12px 0', opacity: !name.trim() ? 0.45 : 1 }}
          >
            <Plus size={15} /> 채널 추가
          </button>
        </div>
      </ModalBox>
    </Overlay>
  )
}

/* ─────────────────────────────────────────
   모달: 삭제 확인
───────────────────────────────────────── */
function DeleteModal({ room, onClose, onDelete }: { room: RoomOut; onClose: () => void; onDelete: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="" onClose={onClose} width={380}>
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 56, height: 56, background: '#fef2f2', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>{room.emoji}</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{room.kind === 'dm' ? '대화 삭제' : '채팅방 삭제'}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{room.name}</strong> {room.kind === 'dm' ? '대화를' : '채팅방을'} 삭제하시겠습니까?<br />모든 메시지가 영구적으로 삭제됩니다.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '11px 0' }}>취소</button>
            <button onClick={onDelete} style={{ flex: 1, padding: '11px 0', border: 'none', borderRadius: 8, background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  )
}

/* ─────────────────────────────────────────
   메인 채팅 페이지
───────────────────────────────────────── */
export default function ChatPage() {
  const { user } = useAuth()
  const { rooms, activeId, setActiveId, messages, loadingMessages, sendMessage, createRoom, deleteRoom, typingUsers, emitTyping } = useChat()

  const [input, setInput] = useState('')
  const [showNewDm, setShowNewDm] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [showNewClass, setShowNewClass] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RoomOut | null>(null)
  const [allUsers, setAllUsers] = useState<UserOut[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const myApiId = user?._apiId || 0
  const isTeacher = user?.role === 'teacher'

  // 전체 유저 목록 로드 (DM 상대 선택, 아바타 표시용)
  useEffect(() => {
    usersApi.list().then((data: any) => setAllUsers(data.filter((u: any) => u.role !== 'admin'))).catch(() => {})
  }, [])

  const classRooms = rooms.filter(r => r.kind.startsWith('class_'))
  const groupRooms = rooms.filter(r => r.kind === 'group')
  const dmRooms = rooms.filter(r => r.kind === 'dm')
  const activeRoom = rooms.find(r => r.id === activeId)
  const canSend = activeRoom && (!activeRoom.is_teacher_only || isTeacher)
  const totalUnread = rooms.reduce((s, r) => s + r.unread, 0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    if (!input.trim() || !activeRoom || !canSend) return
    await sendMessage(activeRoom.id, input.trim())
    setInput('')
    // 메시지 보내면 타이핑 종료
    if (activeRoom) emitTyping(activeRoom.id, false)
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = null
    }
  }

  // 타이핑 디바운스 — 마지막 키 입력 후 1.5초 뒤에 stop
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleInputChange = (val: string) => {
    setInput(val)
    if (!activeRoom) return
    if (val.length > 0) {
      emitTyping(activeRoom.id, true)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        emitTyping(activeRoom.id, false)
        typingTimerRef.current = null
      }, 1500)
    } else {
      emitTyping(activeRoom.id, false)
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = null
      }
    }
  }

  const openDm = async (target: ChatUser) => {
    await createRoom({ kind: 'dm', name: target.name, emoji: '👤', description: '1:1 대화', is_teacher_only: false, member_ids: [myApiId, target.id] })
  }

  const roomDisplayName = () => {
    if (!activeRoom) return ''
    if (activeRoom.kind === 'dm') {
      const otherId = activeRoom.member_ids.find((id: number) => id !== myApiId)
      const other = allUsers.find(u => u.id === otherId)
      return other?.name || activeRoom.name
    }
    return activeRoom.name
  }

  const roomSubtitle = () => {
    if (!activeRoom) return ''
    if (activeRoom.kind === 'dm') {
      const otherId = activeRoom.member_ids.find((id: number) => id !== myApiId)
      const other = allUsers.find(u => u.id === otherId)
      return other?.role === 'teacher' ? (other.subject || '선생님') : `${other?.grade}학년 ${other?.class_num}반`
    }
    if (activeRoom.kind.startsWith('class_')) return `${activeRoom.member_ids.length}명`
    return `${activeRoom.member_ids.length}명 참여 중`
  }

  const canDelete = (room: RoomOut) => {
    if (isTeacher) return !room.kind.startsWith('class_')
    return room.created_by === myApiId && room.kind !== 'dm'
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── 왼쪽: 채팅방 목록 ── */}
        <div style={{ width: 260, background: 'var(--bg-card)', borderRight: '1px solid #e8f0ee', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid var(--border-card)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                채팅
                {totalUnread > 0 && <span style={{ background: '#f97316', color: 'white', borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>{totalUnread}</span>}
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <ActionBtn icon={<Edit3 size={14} />} title="새 메시지 (DM)" onClick={() => setShowNewDm(true)} />
                <ActionBtn icon={<Users size={14} />} title="그룹 채팅방 만들기" onClick={() => setShowNewGroup(true)} />
                {isTeacher && <ActionBtn icon={<Hash size={14} />} title="반 채널 추가" onClick={() => setShowNewClass(true)} color="#6366f1" />}
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {user?.role === 'student' && user.grade && user.class
                ? `${user.grade}학년 ${user.class}반`
                : user?.role === 'teacher'
                ? (user.subject || '선생님')
                : ''}
            </p>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
            {classRooms.length > 0 && (
              <>
                <SectionLabel label="반 채널" />
                {classRooms.map(r => (
                  <RoomItem key={r.id} room={r} active={activeId === r.id} myApiId={myApiId} isTeacher={isTeacher} allUsers={allUsers}
                    onClick={() => setActiveId(r.id)}
                    onDelete={isTeacher ? () => setDeleteTarget(r) : undefined}
                  />
                ))}
              </>
            )}
            {groupRooms.length > 0 && (
              <>
                <SectionLabel label="그룹 채팅" />
                {groupRooms.map(r => (
                  <RoomItem key={r.id} room={r} active={activeId === r.id} myApiId={myApiId} isTeacher={isTeacher} allUsers={allUsers}
                    onClick={() => setActiveId(r.id)}
                    onDelete={canDelete(r) ? () => setDeleteTarget(r) : undefined}
                  />
                ))}
              </>
            )}
            {dmRooms.length > 0 && (
              <>
                <SectionLabel label="다이렉트 메시지" />
                {dmRooms.map(r => (
                  <RoomItem key={r.id} room={r} active={activeId === r.id} myApiId={myApiId} isTeacher={isTeacher} allUsers={allUsers}
                    onClick={() => setActiveId(r.id)}
                    onDelete={() => setDeleteTarget(r)}
                  />
                ))}
              </>
            )}
            <div style={{ padding: '10px 10px 6px' }}>
              <button onClick={() => setShowNewDm(true)} style={{ width: '100%', padding: '8px 12px', border: '1.5px dashed #c8ddd9', borderRadius: 8, background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a7a6e'; e.currentTarget.style.color = '#1a7a6e' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#c8ddd9'; e.currentTarget.style.color = '#6b8a85' }}
              ><Edit3 size={13} /> 새 메시지 보내기</button>
              <button onClick={() => setShowNewGroup(true)} style={{ width: '100%', padding: '8px 12px', border: '1.5px dashed #c8ddd9', borderRadius: 8, background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a7a6e'; e.currentTarget.style.color = '#1a7a6e' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#c8ddd9'; e.currentTarget.style.color = '#6b8a85' }}
              ><Users size={13} /> 그룹 채팅 만들기</button>
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>온라인</span>
          </div>
        </div>

        {/* ── 오른쪽: 채팅 영역 ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
          {activeRoom ? (
            <>
              {/* 헤더 */}
              <div style={{ padding: '13px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                {activeRoom.kind === 'dm' ? (
                  (() => {
                    const otherId = activeRoom.member_ids.find((id: number) => id !== myApiId)
                    const other = allUsers.find(u => u.id === otherId)
                    return other ? (
                      other.profile_image ? <img src={getMediaUrl(other.profile_image) || ''} alt="프로필" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 38, height: 38, borderRadius: '50%', background: other.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: other.avatar_text.length > 1 ? 11 : 15, fontWeight: 700, color: 'white', flexShrink: 0 }}>{other.avatar_text}</div>
                    ) : null
                  })()
                ) : (
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#e8f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{activeRoom.emoji}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{roomDisplayName()}</span>
                    {activeRoom.is_teacher_only && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, background: '#fff7ed', color: '#f97316', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
                        <Lock size={9} /> 선생님 전용
                      </span>
                    )}
                    {activeRoom.kind === 'dm' && <span style={{ fontSize: 10, background: '#eff6ff', color: '#3b82f6', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>DM</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{roomSubtitle()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, background: '#f0fdf4', color: '#22c55e', padding: '3px 9px', borderRadius: 6, fontWeight: 700 }}>🟢 LIVE</span>
                  {canDelete(activeRoom) && (
                    <button onClick={() => setDeleteTarget(activeRoom)} style={{ width: 32, height: 32, border: 'none', background: '#fef2f2', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* 메시지 목록 */}
              <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {loadingMessages ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>불러오는 중...</div>
                ) : messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 10, paddingTop: 80 }}>
                    <span style={{ fontSize: 48 }}>{activeRoom.kind === 'dm' ? '👋' : activeRoom.emoji}</span>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>{activeRoom.kind === 'dm' ? `${roomDisplayName()}님과의 대화` : activeRoom.name}</div>
                    <div style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>{activeRoom.kind === 'dm' ? '첫 메시지를 보내보세요!' : (activeRoom.description || '채팅을 시작해보세요!')}</div>
                  </div>
                ) : (
                  messages.map((m: MessageOut, i: number) => {
                    const isMe = m.user_id === myApiId
                    const prevSame = i > 0 && messages[i - 1].user_id === m.user_id
                    const isDmRoom = activeRoom.kind === 'dm'
                    const timeStr = new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })

                    if (isDmRoom) {
                      return (
                        <div key={m.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginTop: prevSame ? 3 : 14 }}>
                          {!prevSame && !isMe
                            ? (m.profile_image ? <img src={getMediaUrl(m.profile_image) || ''} alt="프로필" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 34, height: 34, borderRadius: '50%', background: m.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: m.avatar_text.length > 1 ? 11 : 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>{m.avatar_text}</div>)
                            : !isMe ? <div style={{ width: 34, flexShrink: 0 }} /> : null
                          }
                          <div style={{ maxWidth: 480 }}>
                            {!prevSame && !isMe && (
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: m.is_teacher ? '#1a7a6e' : '#1a2e2b' }}>{m.user_name}</span>
                                {m.is_teacher && <span style={{ fontSize: 10, background: '#e8f5f3', color: '#1a7a6e', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>선생님</span>}
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeStr}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                              <div style={{ padding: '9px 13px', borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px', fontSize: 14, color: isMe ? 'white' : '#1a2e2b', lineHeight: 1.6, background: isMe ? '#1a7a6e' : 'white', border: isMe ? 'none' : '1px solid #e8f0ee', whiteSpace: 'pre-line', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                {m.content}
                              </div>
                              {isMe && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, paddingBottom: 2 }}>{timeStr}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: prevSame ? 2 : 14 }}>
                        {!prevSame
                          ? (m.profile_image ? <img src={getMediaUrl(m.profile_image) || ''} alt="프로필" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 38, height: 38, borderRadius: '50%', background: m.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: m.avatar_text.length > 1 ? 11 : 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>{m.avatar_text}</div>)
                          : <div style={{ width: 38, flexShrink: 0 }} />
                        }
                        <div style={{ flex: 1 }}>
                          {!prevSame && (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: m.is_teacher ? '#1a7a6e' : '#1a2e2b' }}>{m.user_name}</span>
                              {m.is_teacher && <span style={{ fontSize: 10, background: '#e8f5f3', color: '#1a7a6e', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>선생님</span>}
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeStr}</span>
                            </div>
                          )}
                          <div style={{ display: 'inline-block', background: isMe ? '#e8f5f3' : 'white', padding: '9px 13px', borderRadius: isMe ? '14px 14px 4px 14px' : '4px 14px 14px 14px', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65, maxWidth: 580, border: isMe ? '1px solid #c8e6e0' : '1px solid #e8f0ee', whiteSpace: 'pre-line' }}>
                            {m.content}
                          </div>
                          {m.reactions.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                              {m.reactions.map((r: { emoji: string; count: number }) => (
                                <span key={r.emoji} style={{ fontSize: 12, background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '2px 8px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>{r.emoji} {r.count}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* 입력창 */}
              <div style={{ padding: '12px 28px 18px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-card)', flexShrink: 0 }}>
                {/* 타이핑 중 표시 */}
                {activeRoom && Object.keys(typingUsers[activeRoom.id] || {}).length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'flex', gap: 2 }}>
                      {[0,1,2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#aab8b5', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}
                    </span>
                    <span><strong>{Object.values(typingUsers[activeRoom.id] || {}).join(', ')}</strong>님이 입력 중...</span>
                  </div>
                )}
                {canSend ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', border: '1.5px solid #dde8e5', borderRadius: 14, padding: '10px 14px' }}>
                    <input
                      value={input}
                      onChange={e => handleInputChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                      placeholder={activeRoom.kind === 'dm' ? `${roomDisplayName()}에게 메시지 보내기...` : `${activeRoom.name} 채널에 메시지 보내기...`}
                      style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--text-primary)' }}
                    />
                    <button onClick={send} disabled={!input.trim()} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: input.trim() ? '#1a7a6e' : '#e2e8e6', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                      <Send size={15} color={input.trim() ? 'white' : '#aab8b5'} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '12px 16px' }}>
                    <Lock size={16} color="#aab8b5" />
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>이 채널은 선생님만 메시지를 보낼 수 있습니다</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>채팅을 선택하세요</div>
              <div style={{ fontSize: 13 }}>왼쪽 목록에서 채팅방을 선택하거나 새 메시지를 보내세요</div>
              <button onClick={() => setShowNewDm(true)} className="btn btn-primary" style={{ marginTop: 8, padding: '10px 24px' }}>
                <Edit3 size={14} /> 새 메시지 시작
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 모달 ── */}
      {showNewDm && (
        <NewDmModal myApiId={myApiId} existingRooms={rooms} allUsers={allUsers} onClose={() => setShowNewDm(false)} onOpen={openDm} />
      )}
      {showNewGroup && (
        <NewGroupModal myApiId={myApiId} isTeacher={isTeacher} allUsers={allUsers} onClose={() => setShowNewGroup(false)}
          onCreate={(name, emoji, memberIds, teacherOnly) =>
            createRoom({ kind: 'group', name, emoji, description: '', is_teacher_only: teacherOnly, member_ids: memberIds })
          }
        />
      )}
      {showNewClass && (
        <NewClassChannelModal onClose={() => setShowNewClass(false)}
          onCreate={(name, emoji, kind, teacherOnly) =>
            createRoom({ kind, name, emoji, description: '', is_teacher_only: teacherOnly, member_ids: [] })
          }
        />
      )}
      {deleteTarget && (
        <DeleteModal room={deleteTarget} onClose={() => setDeleteTarget(null)}
          onDelete={() => { deleteRoom(deleteTarget.id); setDeleteTarget(null) }}
        />
      )}
    </div>
  )
}