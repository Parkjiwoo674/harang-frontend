'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { announcementsApi, usersApi, AnnouncementOut, UserOut } from '@/lib/api'
import { School, Search, ChevronRight, Users, BookOpen, Calendar } from 'lucide-react'
import { SCHOOL_NAME } from '@/lib/config'

const departments = [
  { id: 'all', name: '전체', icon: '🏫', color: '#1a7a6e' },
  { id: '긴급', name: '긴급', icon: '🚨', color: '#ef4444' },
  { id: '공지', name: '공지', icon: '📢', color: '#3b82f6' },
  { id: '행사', name: '행사', icon: '🎉', color: '#22c55e' },
  { id: '시험', name: '시험', icon: '📝', color: '#8b5cf6' },
]

export default function SchoolPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementOut[]>([])
  const [users, setUsers] = useState<UserOut[]>([])
  const [loading, setLoading] = useState(true)
  const [dept, setDept] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      announcementsApi.list().catch(() => []),
      usersApi.list().catch(() => []),
    ]).then(([anns, us]) => {
      setAnnouncements(anns as AnnouncementOut[])
      setUsers(us as UserOut[])
      setLoading(false)
    })
  }, [])

  const filtered = announcements.filter(n => {
    const matchDept = dept === 'all' || n.category === dept
    const matchSearch = n.title.includes(search) || n.author_name.includes(search)
    return matchDept && matchSearch
  })

  const students = users.filter(u => u.role === 'student')
  const teachers = users.filter(u => u.role === 'teacher')

  // 학급별 그룹핑
  const classMap: Record<string, UserOut[]> = {}
  students.forEach(s => {
    const key = `${s.grade}학년 ${s.class_num}반`
    if (!classMap[key]) classMap[key] = []
    classMap[key].push(s)
  })

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <School size={24} color="#1a7a6e" /> 학교 전체
            </h1>
            <p>{SCHOOL_NAME} · 전교생 공지 및 정보</p>
          </div>
        </div>

        {/* 통계 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: '전체 학생', value: `${students.length}명`, icon: <Users size={20} />, color: '#1a7a6e' },
            { label: '선생님', value: `${teachers.length}명`, icon: <School size={20} />, color: '#3b82f6' },
            { label: '전체 공지', value: `${announcements.length}건`, icon: <BookOpen size={20} />, color: '#f97316' },
            { label: '미확인 공지', value: `${announcements.filter(a => !a.is_read).length}건`, icon: <Calendar size={20} />, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* 공지 목록 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {departments.map(d => (
                  <button key={d.id} onClick={() => setDept(d.id)} className="btn" style={{
                    padding: '7px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5,
                    background: dept === d.id ? d.color : 'white',
                    color: dept === d.id ? 'white' : '#6b8a85',
                    border: `1.5px solid ${dept === d.id ? d.color : '#e2e8e6'}`,
                  }}>
                    {d.icon} {d.name}
                  </button>
                ))}
              </div>
              <div className="search-bar" style={{ width: 260 }}>
                <Search size={14} color="#aab8b5" />
                <input placeholder="공지 검색..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>불러오는 중...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>공지가 없습니다</div>
              ) : filtered.map((n, i) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f0f4f3' : 'none', cursor: 'pointer', transition: 'background 0.15s', background: n.is_read ? 'white' : '#fafff9' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fbfa')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'white' : '#fafff9')}
                >
                  {n.is_urgent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />}
                  {!n.is_urgent && <span style={{ width: 6, flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: n.is_read ? 500 : 700, color: 'var(--text-primary)' }}>{n.title}</span>
                    {n.is_urgent && <span style={{ marginLeft: 8, fontSize: 10, background: '#fef2f2', color: '#ef4444', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>긴급</span>}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>{n.author_name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>{new Date(n.created_at).toLocaleDateString('ko-KR')}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>조회 {n.views}</span>
                  <ChevronRight size={14} color="#aab8b5" />
                </div>
              ))}
            </div>
          </div>

          {/* 학급 현황 */}
          <div>
            <div className="card">
              <div className="card-header"><span className="card-title">🏫 학급 현황</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(classMap).sort().map(([className, members]) => {
                  const sample = members[0]
                  const homeroom = teachers.find(t =>
                    t.homeroom_grade === sample?.grade &&
                    t.homeroom_class_num === sample?.class_num
                  )
                  return (
                    <div key={className} style={{ padding: '12px', borderRadius: 9, background: 'var(--bg)', border: '1.5px solid #e8f0ee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{className}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{members.length}명</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {homeroom ? `담임: ${homeroom.name} 선생님` : `학생 ${members.length}명`}
                      </div>
                    </div>
                  )
                })}
                {Object.keys(classMap).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>학급 정보 없음</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}