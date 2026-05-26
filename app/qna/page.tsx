'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { qnaApi, QnAPostOut } from '@/lib/api'
import { HelpCircle, Search, ThumbsUp, MessageSquare, Plus, X, Send, Check } from 'lucide-react'

const subjects = ['전체', '수학', '영어', '프로그래밍', '물리', '역사', '국어', '체육']
const subjectColors: Record<string, { bg: string; color: string }> = {
  '수학':       { bg: '#f5f3ff', color: '#8b5cf6' },
  '영어':       { bg: '#eff6ff', color: '#3b82f6' },
  '프로그래밍': { bg: '#f0fdf4', color: '#22c55e' },
  '물리':       { bg: '#fff7ed', color: '#f97316' },
  '역사':       { bg: '#fdf4ff', color: '#d946ef' },
  '국어':       { bg: '#fef2f2', color: '#ef4444' },
  '체육':       { bg: '#f0fdfa', color: '#14b8a6' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export default function QnAPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<QnAPostOut[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('전체')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<QnAPostOut | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newSubject, setNewSubject] = useState('수학')
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    qnaApi.list().then(setPosts).finally(() => setLoading(false))
  }, [])

  const filtered = posts.filter(q => {
    const matchSub = subject === '전체' || q.subject === subject
    const matchSearch = q.title.includes(search) || q.author_name.includes(search)
    return matchSub && matchSearch
  })

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    const post = await qnaApi.create({ title: newTitle, content: newContent, subject: newSubject })
    setPosts(prev => [post, ...prev])
    setShowNew(false)
    setNewTitle(''); setNewContent(''); setNewSubject('수학')
  }

  // 좋아요 토글 — is_liked 상태로 버튼 표시 변경
  const handleLike = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await qnaApi.like(id)
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: res.likes, is_liked: res.is_liked } : p))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, likes: res.likes, is_liked: res.is_liked } : prev)
  }

  const handleAnswer = async () => {
    if (!selected || !replyText.trim() || submitting) return
    setSubmitting(true)
    try {
      const answer = await qnaApi.answer(selected.id, replyText)
      const updated = { ...selected, answers: [...selected.answers, answer], answer_count: selected.answer_count + 1, is_answered: true }
      setSelected(updated)
      setPosts(prev => prev.map(p => p.id === selected.id ? { ...p, answer_count: p.answer_count + 1, is_answered: true } : p))
      setReplyText('')
    } finally {
      setSubmitting(false)
    }
  }

  // 답변 채택 — 질문 작성자 또는 선생님만 가능
  const handleAccept = async (answerId: number) => {
    if (!selected) return
    await qnaApi.acceptAnswer(answerId)
    setSelected(prev => prev ? {
      ...prev,
      answers: prev.answers.map(a => a.id === answerId ? { ...a, is_accepted: true } : a)
    } : prev)
  }

  const canAccept = (post: QnAPostOut) =>
    user?.role === 'teacher' || post.author_id === user?._apiId

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <HelpCircle size={24} color="#1a7a6e" /> 질문 게시판
            </h1>
            <p>궁금한 것을 자유롭게 질문하세요</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={15} /> 질문하기
          </button>
        </div>

        {showNew && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div className="card" style={{ width: 560, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e2b' }}>새 질문 작성</h3>
                <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aab8b5' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>과목</label>
                  <select className="input" value={newSubject} onChange={e => setNewSubject(e.target.value)} style={{ cursor: 'pointer' }}>
                    {subjects.filter(s => s !== '전체').map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>제목</label>
                  <input className="input" placeholder="질문 제목을 입력하세요" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>내용</label>
                  <textarea className="input" placeholder="질문 내용을 자세히 작성해주세요" value={newContent} onChange={e => setNewContent(e.target.value)} style={{ minHeight: 120 }} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowNew(false)}>취소</button>
                  <button className="btn btn-primary" onClick={handleCreate} disabled={!newTitle.trim() || !newContent.trim()}>질문 등록</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {subjects.map(s => (
              <button key={s} onClick={() => setSubject(s)} className="btn" style={{
                padding: '7px 14px', fontSize: 12,
                background: subject === s ? '#1a7a6e' : 'white',
                color: subject === s ? 'white' : '#6b8a85',
                border: `1.5px solid ${subject === s ? '#1a7a6e' : '#e2e8e6'}`,
              }}>{s}</button>
            ))}
          </div>
          <div className="search-bar" style={{ width: 260 }}>
            <Search size={14} color="#aab8b5" />
            <input placeholder="질문 검색..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aab8b5' }}>불러오는 중...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 480px' : '1fr', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(q => {
                const sc = subjectColors[q.subject]
                return (
                  <div key={q.id} className="card" onClick={() => setSelected(q)} style={{ cursor: 'pointer', transition: 'box-shadow 0.15s', border: selected?.id === q.id ? '2px solid #1a7a6e' : '2px solid transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: sc?.bg, color: sc?.color }}>{q.subject}</span>
                          {q.is_answered && <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#22c55e' }}>✓ 답변 완료</span>}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e2b', marginBottom: 6 }}>{q.title}</div>
                        <div style={{ fontSize: 12, color: '#aab8b5' }}>{q.author_name} · {timeAgo(q.created_at)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 14, color: '#aab8b5', fontSize: 13 }}>
                        {/* 좋아요: 이미 눌렀으면 초록색으로 표시 */}
                        <span
                          style={{ display: 'flex', alignItems: 'center', gap: 4, color: (q as any).is_liked ? '#22c55e' : '#aab8b5', cursor: 'pointer' }}
                          onClick={e => handleLike(q.id, e)}
                        >
                          <ThumbsUp size={13} fill={(q as any).is_liked ? '#22c55e' : 'none'} />{q.likes}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={13} />{q.answer_count}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#aab8b5' }}>질문이 없습니다</div>
              )}
            </div>

            {selected && (
              <div className="card fade-in" style={{ alignSelf: 'start' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aab8b5', fontSize: 18 }}>×</button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 12, fontWeight: 700, background: subjectColors[selected.subject]?.bg, color: subjectColors[selected.subject]?.color }}>{selected.subject}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1a2e2b', marginBottom: 8 }}>{selected.title}</h3>
                <div style={{ fontSize: 12, color: '#aab8b5', marginBottom: 16 }}>{selected.author_name} · {timeAgo(selected.created_at)}</div>
                <div style={{ height: 1, background: '#e8f0ee', marginBottom: 14 }} />
                <p style={{ fontSize: 14, color: '#3d5a56', lineHeight: 1.8, marginBottom: 20, whiteSpace: 'pre-wrap' }}>{selected.content}</p>

                {selected.answers.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6b8a85', marginBottom: 10 }}>💬 답변 {selected.answers.length}개</div>
                    {selected.answers.map(a => (
                      <div key={a.id} style={{ background: '#f6faf9', borderRadius: 10, padding: 14, marginBottom: 8, border: a.is_accepted ? '1.5px solid #22c55e' : '1px solid #e8f0ee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>{a.avatar_text}</div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2e2b' }}>{a.author_name}</span>
                          {a.is_accepted && (
                            <span style={{ fontSize: 10, background: '#f0fdf4', color: '#22c55e', padding: '1px 6px', borderRadius: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Check size={10} /> 채택
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: '#aab8b5', marginLeft: 'auto' }}>{timeAgo(a.created_at)}</span>
                          {/* 채택 버튼 — 아직 채택 안 됐고 권한 있는 경우만 표시 */}
                          {!a.is_accepted && !selected.answers.some(x => x.is_accepted) && canAccept(selected) && (
                            <button
                              onClick={() => handleAccept(a.id)}
                              style={{ fontSize: 11, background: '#e8f5f3', color: '#1a7a6e', border: '1px solid #c8e6e0', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                            >
                              채택
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: '#3d5a56', lineHeight: 1.7 }}>{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selected.answers.length === 0 && (
                  <div style={{ background: '#f6faf9', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <p style={{ fontSize: 13, color: '#aab8b5' }}>아직 답변이 없어요. 첫 번째로 답변해보세요!</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" placeholder="답변을 입력하세요..." value={replyText} onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAnswer()} style={{ flex: 1 }} />
                  <button className="btn btn-primary" onClick={handleAnswer} disabled={!replyText.trim() || submitting} style={{ padding: '10px 14px', flexShrink: 0 }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}