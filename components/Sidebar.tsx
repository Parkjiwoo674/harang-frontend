'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, BookOpen, ClipboardList, Calendar, BarChart2, MessageCircle, HelpCircle, School, Settings, Home, LogOut, Megaphone, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import { APP_NAME, SCHOOL_NAME } from '@/lib/config'

const STUDENT_NAV = [
  { href: '/dashboard',     icon: Home,          label: '대시보드',    section: null },
  { href: '/notifications', icon: Bell,          label: '알림 센터',   section: null },
  { href: '/announcements', icon: BookOpen,      label: '공지사항',    section: '학습' },
  { href: '/assignments',   icon: ClipboardList, label: '과제 제출',   section: null },
  { href: '/schedule',      icon: Calendar,      label: '시간표·일정', section: null },
  { href: '/grades',        icon: BarChart2,     label: '성적 현황',   section: null },
  { href: '/chat',          icon: MessageCircle, label: '반 채팅',     section: '소통' },
  { href: '/qna',           icon: HelpCircle,    label: '질문 게시판', section: null },
  { href: '/school',        icon: School,        label: '학교 전체',   section: null },
]

const TEACHER_NAV = [
  { href: '/dashboard',     icon: Home,          label: '대시보드',    section: null },
  { href: '/notifications', icon: Bell,          label: '알림 센터',   section: null },
  { href: '/announcements', icon: Megaphone,     label: '공지사항',    section: '수업 관리' },
  { href: '/assignments',   icon: ClipboardList, label: '과제 관리',   section: null },
  { href: '/schedule',      icon: Calendar,      label: '시간표·일정', section: null },
  { href: '/grades',        icon: BarChart2,     label: '성적 관리',   section: null },
  { href: '/chat',          icon: MessageCircle, label: '반 채팅',     section: '소통' },
  { href: '/qna',           icon: HelpCircle,    label: '질문 게시판', section: null },
  { href: '/school',        icon: School,        label: '학교 전체',   section: null },
]

const ADMIN_NAV = [
  { href: '/admin',         icon: Shield,        label: '관리자',      section: '관리' }
  ]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { rooms } = useChat()

  const navItems = user?.role === 'admin' ? ADMIN_NAV : user?.role === 'teacher' ? TEACHER_NAV : STUDENT_NAV
  let currentSection: string | null = null

  const handleLogout = () => { logout(); router.push('/login') }
  const isTeacher = user?.role === 'teacher'
  const isAdmin = user?.role === 'admin'

  const chatUnread = rooms.reduce((s, r) => s + r.unread, 0)

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">{APP_NAME[0]}</div>
        <div className="logo-text">
          <h2>{APP_NAME}</h2>
          <p>{SCHOOL_NAME}</p>
        </div>
      </div>

      <Link href="/settings" className="user-card" style={{ textDecoration: 'none' }}>
        <div className="user-avatar" style={{ background: user?.avatarColor || '#22c55e', fontSize: user?.avatarText && user.avatarText.length > 1 ? 11 : 14 }}>
          {user?.avatarText || '?'}
        </div>
        <div className="user-info">
          <h4>{user?.name || '게스트'}</h4>
          <p style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isAdmin
              ? <><span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 3, padding: '0px 4px', fontSize: 9, fontWeight: 700 }}>관리자</span></>
              : isTeacher
              ? <><span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 3, padding: '0px 4px', fontSize: 9, fontWeight: 700 }}>선생님</span> {user?.subject}</>
              : `${user?.grade}학년 ${user?.class}반 · ${user?.number}번`
            }
          </p>
        </div>
      </Link>

      <div style={{ margin: '0 12px 8px', padding: '6px 10px', borderRadius: 8, background: isAdmin ? 'rgba(99,102,241,0.3)' : isTeacher ? 'rgba(99,102,241,0.25)' : 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isAdmin ? '#a5b4fc' : isTeacher ? '#818cf8' : '#22c55e' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: isAdmin ? '#e0e7ff' : isTeacher ? '#c7d2fe' : '#86efac' }}>
          {isAdmin ? '관리자 계정' : isTeacher ? '교사 계정' : '학생 계정'}
        </span>
      </div>

      <nav className="nav-section">
        {navItems.map((item) => {
          const showLabel = item.section && item.section !== currentSection
          if (showLabel) currentSection = item.section
          const badge = item.href === '/chat' ? chatUnread : 0

          return (
            <div key={item.href}>
              {showLabel && <div className="nav-label">{item.section}</div>}
              <Link href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <div className="nav-icon">
                  <item.icon size={16} />
                </div>
                {item.label}
                {badge > 0 && <span className="badge">{badge}</span>}
              </Link>
            </div>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        <span className="version-text">v1.0.0</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link href="/settings" className="icon-btn" title="설정">
            <Settings size={14} />
          </Link>
          <button onClick={handleLogout} className="icon-btn" title="로그아웃" style={{ border: 'none', cursor: 'pointer' }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}