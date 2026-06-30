'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import {
  announcementsApi, assignmentsApi, scheduleApi, notificationsApi,
  AnnouncementOut, AssignmentOut, ScheduleItem, NotificationOut,
} from '@/lib/api'
import { Bell, Search, Send } from 'lucide-react'

const TIMES = ['08:40–09:30', '09:40–10:30', '10:40–11:30', '11:40–12:30', '13:20–14:10', '14:20–15:10', '15:20–16:10']
const SUBJECT_COLORS: Record<string, string> = {
  '국어': '#ef4444', '수학': '#8b5cf6', '영어': '#3b82f6', '물리': '#f97316',
  '역사': '#d946ef', '프로그래밍': '#22c55e', '체육': '#14b8a6',
}
const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  긴급: { bg: '#fef2f2', color: '#ef4444' },
  행사: { bg: '#eff6ff', color: '#3b82f6' },
  시험: { bg: '#f5f3ff', color: '#8b5cf6' },
  과제: { bg: '#fff7ed', color: '#f97316' },
  변경: { bg: '#fff7ed', color: '#f97316' },
  공지: { bg: '#e8f5f3', color: '#1a7a6e' },
}

function getDday(dueDate: string) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { rooms, messages, activeId, setActiveId } = useChat()

  const [announcements, setAnnouncements] = useState<AnnouncementOut[]>([])
  const [assignments, setAssignments] = useState<AssignmentOut[]>([])
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([])
  const [notifications, setNotifications] = useState<NotificationOut[]>([])
  const [chatTab, setChatTab] = useState('공지')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const todayDay = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()]
  const now = new Date()
  const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${['일', '월', '화', '수', '목', '금', '토'][now.getDay()]}요일`

  useEffect(() => {
    Promise.all([
      announcementsApi.list().catch(() => []),
      assignmentsApi.list().catch(() => []),
      scheduleApi.timetable(
        user?.grade ?? undefined,
        user?.class ?? undefined
      ).catch(() => []),
      notificationsApi.list().catch(() => []),
    ]).then(([anns, asns, sched, notifs]) => {
      setAnnouncements(anns as AnnouncementOut[])
      setAssignments(asns as AssignmentOut[])
      setTodaySchedule((sched as ScheduleItem[]).filter(s => s.day === todayDay).sort((a, b) => a.period - b.period))
      setNotifications(notifs as NotificationOut[])
    })
  }, [])

  const unreadAnns = announcements.filter(a => !a.is_read)
  const pendingAssignments = assignments.filter(a => !a.is_submitted)
  const urgentCount = unreadAnns.filter(a => a.is_urgent).length

  // 현재 교시 계산
  const currentHour = now.getHours()
  const currentMin = now.getMinutes()
  const currentMinutes = currentHour * 60 + currentMin
  const periodTimes = [
    [8 * 60 + 40, 9 * 60 + 30],
    [9 * 60 + 40, 10 * 60 + 30],
    [10 * 60 + 40, 11 * 60 + 30],
    [11 * 60 + 40, 12 * 60 + 30],
    [13 * 60 + 20, 14 * 60 + 10],
    [14 * 60 + 20, 15 * 60 + 10],
    [15 * 60 + 20, 16 * 60 + 10],
  ]
  const currentPeriod = periodTimes.findIndex(([s, e]) => currentMinutes >= s && currentMinutes <= e) + 1

  // 통합 검색: 공지 + 과제
  const trimmedQuery = searchQuery.trim()
  const searchResults = trimmedQuery
    ? [
        ...announcements
          .filter(a => a.title.includes(trimmedQuery))
          .map(a => ({ type: '공지' as const, id: a.id, title: a.title, href: '/announcements' })),
        ...assignments
          .filter(a => a.title.includes(trimmedQuery))
          .map(a => ({ type: '과제' as const, id: a.id, title: a.title, href: '/assignments' })),
      ].slice(0, 8)
    : []

  // 채팅: 공지/자유/질문 탭에 맞는 room
  const tabKindMap: Record<string, string> = { '공지': 'class_notice', '자유': 'class_free', '질문': 'class_question' }
  const chatRoom = rooms.find(r => r.kind === tabKindMap[chatTab])
  const chatRoomMessages = chatRoom?.id === activeId ? messages : []

  const handleChatTabChange = (tab: string) => {
    setChatTab(tab)
    const room = rooms.find(r => r.kind === tabKindMap[tab])
    if (room) setActiveId(room.id)
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

        {/* 상단 바 */}
        <div style={{ padding: '22px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
              👋 안녕하세요, {user?.name || '사용자'}{user?.role === 'teacher' ? ' 선생님' : ' 학생'}!
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              {dateStr} {currentPeriod > 0 ? `· 현재 ${currentPeriod}교시 진행 중` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {urgentCount > 0 && (
              <Link href="/announcements" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 8, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>긴급 공지 {urgentCount}건 미확인</span>
                </div>
              </Link>
            )}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', borderRadius: 9, padding: '8px 14px', border: '1.5px solid var(--border)', width: 220 }}>
                <Search size={14} color="#aab8b5" />
                <input
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  style={{ border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', background: 'transparent', width: '100%', fontFamily: 'inherit' }}
                />
              </div>
              {searchOpen && trimmedQuery && (
                <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 10, boxShadow: '0 12px 30px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 50 }}>
                  {searchResults.length === 0 ? (
                    <div style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)' }}>검색 결과가 없습니다.</div>
                  ) : (
                    searchResults.map(r => (
                      <Link key={`${r.type}-${r.id}`} href={r.href} onClick={() => setSearchOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#1a7a6e', background: '#e8f5f3', borderRadius: 6, padding: '2px 6px', flexShrink: 0 }}>{r.type}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
            <Link href="/notifications">
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                <Bell size={16} color="#3d5a56" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, background: '#f97316', borderRadius: '50%', fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* 그리드 본문 */}
        <div style={{ flex: 1, padding: '18px 32px 24px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

          {/* 요약 카드 4개 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, flexShrink: 0 }}>
            <SummaryCard gradient="linear-gradient(135deg,#2a9a8a 0%,#1a6b60 100%)" label="공지" icon="📣"
              num={String(unreadAnns.length)} sub={`미확인 공지 · 전체 ${announcements.length}건`} />
            <SummaryCard gradient="linear-gradient(135deg,#f97316 0%,#ea650a 100%)" label="과제" icon="📋"
              num={String(pendingAssignments.length)} sub={`미제출 · ${pendingAssignments.filter(a => getDday(a.due_date) === 0).length}건 오늘 마감`} />
            <SummaryCard gradient="linear-gradient(135deg,#22c55e 0%,#16a34a 100%)" label="알림" icon="🔔"
              num={String(notifications.filter(n => !n.is_read).length)} sub="읽지 않은 알림" />
            <SummaryCard gradient="linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)" label="시간표" icon={null}
              num={String(todaySchedule.length)} sub={`오늘 수업 · ${todayDay}요일`} />
          </div>

          {/* 메인 4패널 */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, minHeight: 0 }}>

            {/* 패널1: 미확인 공지 */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>📋 미확인 공지</span>
                <Link href="/announcements" style={{ fontSize: 12, color: '#1a7a6e', fontWeight: 600, textDecoration: 'none' }}>전체 보기</Link>
              </div>
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {unreadAnns.slice(0, 5).map((n, i) => (
                  <div key={n.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < Math.min(unreadAnns.length, 5) - 1 ? '1px solid #f0f4f3' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a7a6e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {n.author_name.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{n.author_name}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>{n.title}</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: TAG_COLORS[n.category]?.bg || '#f3f4f6', color: TAG_COLORS[n.category]?.color || '#6b7280' }}>{n.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {unreadAnns.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>미확인 공지 없음 ✅</div>
                )}
              </div>
            </div>

            {/* 패널2: 오늘 시간표 */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>📅 오늘 시간표</span>
                <Link href="/schedule" style={{ fontSize: 12, color: '#1a7a6e', fontWeight: 600, textDecoration: 'none' }}>{todayDay}요일</Link>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {todaySchedule.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>오늘 수업 없음</div>
                ) : todaySchedule.map(s => {
                  const isCurrent = s.period === currentPeriod
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: isCurrent ? '#e8f5f3' : 'transparent', border: `1.5px solid ${isCurrent ? '#1a7a6e' : 'transparent'}`, flex: 1 }}>
                      <span style={{ width: 20, textAlign: 'center', fontSize: 14, fontWeight: 800, color: isCurrent ? '#1a7a6e' : '#aab8b5', flexShrink: 0 }}>{s.period}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 80, flexShrink: 0 }}>{TIMES[s.period - 1]?.split('–')[0]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.subject}</span>
                          {isCurrent && <span style={{ fontSize: 10, background: '#1a7a6e', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 700, whiteSpace: 'nowrap' }}>진행 중</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.room}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 패널3: 마감 임박 과제 */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>📝 마감 임박 과제</span>
                <Link href="/assignments" style={{ fontSize: 12, color: '#1a7a6e', fontWeight: 600, textDecoration: 'none' }}>과제 채널</Link>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {pendingAssignments.slice(0, 5).map((a, i) => {
                  const dday = getDday(a.due_date)
                  const color = SUBJECT_COLORS[a.subject] || '#1a7a6e'
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < Math.min(pendingAssignments.length, 5) - 1 ? '1px solid #f0f4f3' : 'none', flex: 1 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid #e2e8e6`, background: 'var(--bg-card)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: color + '20', color, display: 'inline-block', marginBottom: 3 }}>{a.subject}</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, flexShrink: 0, color: dday === 0 ? '#ef4444' : dday <= 3 ? '#f97316' : '#aab8b5' }}>
                        {dday === 0 ? 'D-Day' : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}
                      </span>
                    </div>
                  )
                })}
                {pendingAssignments.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>미제출 과제 없음 🎉</div>
                )}
              </div>
            </div>

            {/* 패널4: 반 채팅 미리보기 */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border-card)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>반 채팅</span>
                  <span style={{ fontSize: 10, background: '#f0fdf4', color: '#22c55e', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>● LIVE</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['공지', '자유', '질문'].map(t => (
                    <button key={t} onClick={() => handleChatTabChange(t)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: chatTab === t ? '#e8f5f3' : 'transparent', color: chatTab === t ? '#1a7a6e' : '#6b8a85' }}>
                      {t === '공지' ? '📣' : t === '자유' ? '🗨️' : '❓'} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chatRoomMessages.slice(-6).map((m, i) => (
                  <div key={m.id} style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: m.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>{m.avatar_text}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: m.is_teacher ? '#1a7a6e' : '#1a2e2b' }}>{m.user_name}</span>
                        {m.is_teacher && <span style={{ fontSize: 9, background: '#e8f5f3', color: '#1a7a6e', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>선생님</span>}
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg)', padding: '7px 10px', borderRadius: '4px 10px 10px 10px', lineHeight: 1.55, whiteSpace: 'pre-line', display: 'inline-block', maxWidth: '100%', border: '1px solid var(--border-card)' }}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {chatRoomMessages.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>메시지가 없습니다</div>
                )}
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f4f3', flexShrink: 0 }}>
                <Link href="/chat" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', borderRadius: 10, padding: '8px 12px', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'inherit' }}>채팅하러 가기...</span>
                    <Send size={13} color="#aab8b5" />
                  </div>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function SummaryCard({ gradient, label, icon, num, sub }: { gradient: string; label: string; icon: string | null; num: string; sub: string }) {
  return (
    <div style={{ background: gradient, borderRadius: 16, padding: '22px 24px', color: 'white', position: 'relative', overflow: 'hidden', minHeight: 130 }}>
      <div style={{ position: 'absolute', top: -24, right: -24, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', bottom: -16, left: 30, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, position: 'relative' }}>
        {icon ? <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.18)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div> : <div />}
        <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.22)', padding: '3px 9px', borderRadius: 6 }}>{label}</span>
      </div>
      <div style={{ fontSize: num.length > 3 ? 42 : 52, fontWeight: 900, letterSpacing: -2, lineHeight: 1, marginBottom: 6, position: 'relative' }}>{num}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', position: 'relative' }}>{sub}</div>
    </div>
  )
}