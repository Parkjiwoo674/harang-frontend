'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { notificationsApi, NotificationOut } from '@/lib/api'
import { Bell, BookOpen, ClipboardList, MessageCircle, Check, CheckCheck, Trash2 } from 'lucide-react'

const typeIcon: Record<string, string> = { notice: '📣', assign: '📋', chat: '💬' }
const filters = ['전체', '공지', '과제', '채팅']
const tagColors: Record<string, string> = {
  '긴급': 'tag-red', '시험': 'tag-purple', '행사': 'tag-blue',
  '과제': 'tag-orange', '변경': 'tag-orange', '공지': 'tag-teal',
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationOut[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('전체')

  useEffect(() => {
    notificationsApi.list().then(setItems).finally(() => setLoading(false))
  }, [])

  const unread = items.filter(n => !n.is_read).length

  const markOne = async (id: number) => {
    await notificationsApi.markRead(id).catch(() => {})
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAll = async () => {
    await notificationsApi.markAllRead().catch(() => {})
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const deleteRead = () => setItems(prev => prev.filter(n => !n.is_read))

  const filtered = items.filter(n => {
    if (activeFilter === '전체') return true
    if (activeFilter === '공지') return n.type === 'notice'
    if (activeFilter === '과제') return n.type === 'assign'
    if (activeFilter === '채팅') return n.type === 'chat'
    return true
  })

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return '방금'
    if (m < 60) return `${m}분 전`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}시간 전`
    return `${Math.floor(h / 24)}일 전`
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={24} color="#1a7a6e" /> 알림 센터
              {unread > 0 && <span style={{ background: '#f97316', color: 'white', borderRadius: 10, fontSize: 12, fontWeight: 700, padding: '2px 8px' }}>{unread}</span>}
            </h1>
            <p>읽지 않은 알림 {unread}개 · 전체 {items.length}개</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={markAll} style={{ gap: 6 }}>
              <CheckCheck size={15} /> 전체 읽음
            </button>
            <button className="btn" style={{ background: '#fef2f2', color: '#ef4444' }} onClick={deleteRead}>
              <Trash2 size={15} /> 읽은 알림 삭제
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {filters.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} className="btn" style={{
                  padding: '7px 16px', fontSize: 13,
                  background: activeFilter === f ? '#1a7a6e' : 'white',
                  color: activeFilter === f ? 'white' : '#6b8a85',
                  border: `1.5px solid ${activeFilter === f ? '#1a7a6e' : '#e2e8e6'}`,
                }}>{f}</button>
              ))}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>불러오는 중...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>알림이 없습니다</p>
                </div>
              ) : filtered.map((n, i) => (
                <div key={n.id} onClick={() => markOne(n.id)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #f0f4f3' : 'none',
                  background: n.is_read ? 'white' : '#f6faf9', cursor: 'pointer', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#edf5f3')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'white' : '#f6faf9')}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: n.is_read ? 'transparent' : '#f97316' }} />
                  <div style={{ width: 42, height: 42, background: n.is_read ? '#f3f7f6' : '#e8f5f3', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {typeIcon[n.type] || '🔔'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: n.is_read ? 500 : 700, color: 'var(--text-primary)' }}>{n.title}</span>
                      {n.tag && <span className={`tag ${tagColors[n.tag] || 'tag-gray'}`}>{n.tag}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{n.sender} · {timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && (
                    <button onClick={e => { e.stopPropagation(); markOne(n.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                      <Check size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">알림 요약</span></div>
              {[
                { label: '공지사항', count: items.filter(n => n.type === 'notice').length, icon: <BookOpen size={16} />, color: '#1a7a6e' },
                { label: '과제', count: items.filter(n => n.type === 'assign').length, icon: <ClipboardList size={16} />, color: '#f97316' },
                { label: '채팅', count: items.filter(n => n.type === 'chat').length, icon: <MessageCircle size={16} />, color: '#3b82f6' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: s.color }}>{s.icon}<span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span></div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.count}건</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}