'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { announcementsApi, AnnouncementOut } from '@/lib/api'
import { BookOpen, Search, Pin, ChevronRight, Eye, Plus, Trash2, X } from 'lucide-react'

const categories = ['전체', '긴급', '공지', '시험', '행사', '변경']
const catColors: Record<string, string> = {
  '긴급': 'tag-red', '공지': 'tag-teal', '시험': 'tag-purple',
  '행사': 'tag-blue', '변경': 'tag-orange',
}

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'

  const [items, setItems] = useState<AnnouncementOut[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('전체')
  const [selected, setSelected] = useState<AnnouncementOut | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('공지')
  const [newPinned, setNewPinned] = useState(false)
  const [newUrgent, setNewUrgent] = useState(false)

  useEffect(() => {
    announcementsApi.list()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = async (a: AnnouncementOut) => {
    setSelected(a)
    if (!a.is_read) {
      await announcementsApi.markRead(a.id).catch(() => {})
      setItems(prev => prev.map(x => x.id === a.id ? { ...x, is_read: true, views: x.views + 1 } : x))
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    const ann = await announcementsApi.create({
      title: newTitle, content: newContent,
      category: newCategory, is_pinned: newPinned, is_urgent: newUrgent,
    })
    setItems(prev => [ann, ...prev])
    setShowNew(false)
    setNewTitle(''); setNewContent(''); setNewCategory('공지'); setNewPinned(false); setNewUrgent(false)
  }

  const handleDelete = async (id: number) => {
    await announcementsApi.delete(id)
    setItems(prev => prev.filter(a => a.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const filtered = items.filter(a => {
    const matchCat = cat === '전체' || a.category === cat
    const matchSearch = a.title.includes(search) || a.author_name.includes(search)
    return matchCat && matchSearch
  })
  const pinned = filtered.filter(a => a.is_pinned)
  const normal = filtered.filter(a => !a.is_pinned)
  const unread = items.filter(a => !a.is_read).length

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={24} color="#1a7a6e" /> 공지사항
            </h1>
            <p>읽지 않은 공지 {unread}건 포함 · 전체 {items.length}건</p>
          </div>
          {isTeacher && (
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={15} /> 공지 작성
            </button>
          )}
        </div>

        {/* New announcement modal */}
        {showNew && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div className="card" style={{ width: 560, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>공지 작성</h3>
                <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>카테고리</label>
                    <select className="input" value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ cursor: 'pointer' }}>
                      {categories.filter(c => c !== '전체').map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', paddingBottom: 2 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={newPinned} onChange={e => setNewPinned(e.target.checked)} style={{ accentColor: '#1a7a6e' }} /> 고정
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#ef4444' }}>
                      <input type="checkbox" checked={newUrgent} onChange={e => setNewUrgent(e.target.checked)} style={{ accentColor: '#ef4444' }} /> 긴급
                    </label>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>제목</label>
                  <input className="input" placeholder="공지 제목" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>내용</label>
                  <textarea className="input" placeholder="공지 내용을 입력하세요" value={newContent} onChange={e => setNewContent(e.target.value)} style={{ minHeight: 120 }} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowNew(false)}>취소</button>
                  <button className="btn btn-primary" onClick={handleCreate} disabled={!newTitle.trim() || !newContent.trim()}>등록</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)} className="btn" style={{
                padding: '7px 16px', fontSize: 13,
                background: cat === c ? '#1a7a6e' : 'white',
                color: cat === c ? 'white' : '#6b8a85',
                border: `1.5px solid ${cat === c ? '#1a7a6e' : '#e2e8e6'}`,
              }}>{c}</button>
            ))}
          </div>
          <div className="search-bar" style={{ width: 280 }}>
            <Search size={14} color="#aab8b5" />
            <input placeholder="제목, 작성자 검색..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>불러오는 중...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 460px' : '1fr', gap: 20 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {pinned.length > 0 && (
                <>
                  <div style={{ padding: '10px 20px 6px', background: 'var(--bg)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1a7a6e', textTransform: 'uppercase', letterSpacing: 0.6, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Pin size={11} /> 고정 공지
                    </span>
                  </div>
                  {pinned.map((a, i) => (
                    <AnnouncRow key={a.id} a={a} isLast={i === pinned.length - 1} onClick={() => handleSelect(a)} active={selected?.id === a.id} isTeacher={isTeacher} onDelete={() => handleDelete(a.id)} />
                  ))}
                  <div style={{ height: 1, background: '#e8f0ee', margin: '4px 0' }} />
                </>
              )}
              {normal.map((a, i) => (
                <AnnouncRow key={a.id} a={a} isLast={i === normal.length - 1} onClick={() => handleSelect(a)} active={selected?.id === a.id} isTeacher={isTeacher} onDelete={() => handleDelete(a.id)} />
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>공지사항이 없습니다</div>
              )}
            </div>

            {selected && (
              <div className="card fade-in" style={{ alignSelf: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span className={`tag ${catColors[selected.category] || 'tag-gray'}`}>{selected.category}</span>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>×</button>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.4 }}>{selected.title}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20, display: 'flex', gap: 12 }}>
                  <span>{selected.author_name}</span>
                  <span>{new Date(selected.created_at).toLocaleDateString('ko-KR')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={12} /> {selected.views}</span>
                </div>
                <div style={{ height: 1, background: '#e8f0ee', marginBottom: 16 }} />
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selected.content}</p>
                <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: selected.is_read ? '#f0fdf4' : '#f6faf9', border: `1px solid ${selected.is_read ? '#bbf7d0' : '#e2e8e6'}`, fontSize: 13, color: selected.is_read ? '#22c55e' : '#6b8a85', fontWeight: 600, textAlign: 'center' }}>
                    {selected.is_read ? '✓ 확인 완료' : '읽음 처리됨'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function AnnouncRow({ a, isLast, onClick, active, isTeacher, onDelete }: {
  a: AnnouncementOut; isLast: boolean; onClick: () => void; active: boolean; isTeacher: boolean; onDelete: () => void
}) {
  const catColors: Record<string, string> = { '긴급': 'tag-red', '공지': 'tag-teal', '시험': 'tag-purple', '행사': 'tag-blue', '변경': 'tag-orange' }
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
      borderBottom: isLast ? 'none' : '1px solid #f0f4f3',
      background: active ? '#f0f9f7' : a.is_read ? 'white' : '#fafff9',
      cursor: 'pointer', transition: 'background 0.15s',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fbfa' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = a.is_read ? 'white' : '#fafff9' }}
    >
      {!a.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />}
      {a.is_pinned && <Pin size={13} color="#1a7a6e" />}
      <span className={`tag ${catColors[a.category] || 'tag-gray'}`} style={{ flexShrink: 0 }}>{a.category}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: a.is_read ? 500 : 700, color: 'var(--text-primary)' }}>{a.title}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>{a.author_name}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>{new Date(a.created_at).toLocaleDateString('ko-KR')}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={12} />{a.views}</span>
      {isTeacher && (
        <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px 4px', marginLeft: 4 }}>
          <Trash2 size={13} />
        </button>
      )}
      <ChevronRight size={14} color="#aab8b5" />
    </div>
  )
}