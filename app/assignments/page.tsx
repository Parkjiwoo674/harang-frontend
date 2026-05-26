'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { assignmentsApi, AssignmentOut, SubmissionOut } from '@/lib/api'
import { ClipboardList, Upload, Check, Clock, AlertCircle, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

const subjectColors: Record<string, { bg: string; color: string }> = {
  '영어':       { bg: '#eff6ff', color: '#3b82f6' },
  '수학':       { bg: '#f5f3ff', color: '#8b5cf6' },
  '국어':       { bg: '#fef2f2', color: '#ef4444' },
  '프로그래밍': { bg: '#f0fdf4', color: '#22c55e' },
  '물리':       { bg: '#fff7ed', color: '#f97316' },
  '역사':       { bg: '#fdf4ff', color: '#d946ef' },
}

function getDday(dueDate: string) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
}

export default function AssignmentsPage() {
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'

  const [items, setItems] = useState<AssignmentOut[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'done'>('pending')
  // 학생: 제출 모달
  const [submitTarget, setSubmitTarget] = useState<AssignmentOut | null>(null)
  const [submitContent, setSubmitContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // 교사: 신규 과제 모달
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', subject: '수학', due_date: '', max_score: '100', description: '' })
  // 교사: 제출 목록 조회
  const [viewSubs, setViewSubs] = useState<{ assignmentId: number; subs: SubmissionOut[] } | null>(null)
  const [grading, setGrading] = useState<Record<number, string>>({})

  useEffect(() => {
    assignmentsApi.list().then(setItems).finally(() => setLoading(false))
  }, [])

  const pending = items.filter(a => !a.is_submitted)
  const done = items.filter(a => a.is_submitted)
  const list = tab === 'pending' ? pending : done

  // 학생 제출
  const handleSubmit = async () => {
    if (!submitTarget || submitting) return
    setSubmitting(true)
    try {
      await assignmentsApi.submit(submitTarget.id, { content: submitContent || '제출 완료' })
      setItems(prev => prev.map(a => a.id === submitTarget.id ? { ...a, is_submitted: true } : a))
      setSubmitTarget(null)
      setSubmitContent('')
    } finally {
      setSubmitting(false)
    }
  }

  // 교사 과제 등록
  const handleCreate = async () => {
    if (!form.title || !form.due_date) return
    const a = await assignmentsApi.create({
      title: form.title, subject: form.subject,
      due_date: new Date(form.due_date).toISOString(),
      max_score: Number(form.max_score),
      description: form.description || undefined,
    })
    setItems(prev => [...prev, a])
    setShowNew(false)
    setForm({ title: '', subject: '수학', due_date: '', max_score: '100', description: '' })
  }

  // 교사 제출 목록 열기
  const handleViewSubs = async (a: AssignmentOut) => {
    if (viewSubs?.assignmentId === a.id) {
      setViewSubs(null)
      return
    }
    const subs = await assignmentsApi.getSubmissions(a.id)
    setViewSubs({ assignmentId: a.id, subs })
  }

  // 교사 채점
  const handleGrade = async (subId: number) => {
    const score = Number(grading[subId])
    if (isNaN(score)) return
    await assignmentsApi.grade(subId, score)
    setViewSubs(prev => prev ? {
      ...prev,
      subs: prev.subs.map(s => s.id === subId ? { ...s, score } : s)
    } : null)
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClipboardList size={24} color="#1a7a6e" /> 과제 {isTeacher ? '관리' : '제출'}
            </h1>
            <p>미제출 {pending.length}개 · 제출 완료 {done.length}개</p>
          </div>
          {isTeacher && (
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={15} /> 과제 등록
            </button>
          )}
        </div>

        {/* 학생 제출 모달 */}
        {submitTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div className="card" style={{ width: 520, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1a2e2b' }}>과제 제출</h3>
                <button onClick={() => setSubmitTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aab8b5' }}><X size={20} /></button>
              </div>
              <div style={{ padding: '12px 14px', background: '#f6faf9', borderRadius: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e2b' }}>{submitTarget.title}</div>
                <div style={{ fontSize: 12, color: '#6b8a85', marginTop: 4 }}>{submitTarget.subject} · {submitTarget.teacher_name} · 배점 {submitTarget.max_score}점</div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>제출 내용</label>
                <textarea
                  className="input"
                  placeholder="과제 내용을 작성하거나 제출 메시지를 입력하세요..."
                  value={submitContent}
                  onChange={e => setSubmitContent(e.target.value)}
                  style={{ minHeight: 120 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setSubmitTarget(null)}>취소</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                  <Upload size={14} /> {submitting ? '제출 중...' : '제출하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 교사 과제 등록 모달 */}
        {showNew && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div className="card" style={{ width: 520, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e2b' }}>과제 등록</h3>
                <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aab8b5' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>과목</label>
                    <select className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={{ cursor: 'pointer' }}>
                      {Object.keys(subjectColors).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>배점</label>
                    <input className="input" type="number" value={form.max_score} onChange={e => setForm(f => ({ ...f, max_score: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>제목</label>
                  <input className="input" placeholder="과제 제목" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>마감일</label>
                  <input className="input" type="datetime-local" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>설명 (선택)</label>
                  <textarea className="input" placeholder="과제 설명" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ minHeight: 80 }} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowNew(false)}>취소</button>
                  <button className="btn btn-primary" onClick={handleCreate} disabled={!form.title || !form.due_date}>등록</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aab8b5' }}>불러오는 중...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', gap: 4, background: 'white', padding: 4, borderRadius: 10, marginBottom: 16, width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {[{ key: 'pending', label: `미제출 (${pending.length})` }, { key: 'done', label: `제출 완료 (${done.length})` }].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key as any)} style={{
                    padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    background: tab === t.key ? '#1a7a6e' : 'transparent',
                    color: tab === t.key ? 'white' : '#6b8a85',
                    fontWeight: 600, fontSize: 13, fontFamily: 'Pretendard, sans-serif',
                  }}>{t.label}</button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {list.map(a => {
                  const dday = getDday(a.due_date)
                  const sc = subjectColors[a.subject]
                  const isExpanded = viewSubs?.assignmentId === a.id
                  return (
                    <div key={a.id} className="card" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: sc?.bg || '#f3f7f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: sc?.color || '#1a7a6e' }}>
                          {a.subject.slice(0, 2)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a2e2b' }}>{a.title}</span>
                            <span style={{ background: sc?.bg, color: sc?.color, fontSize: 11, padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>{a.subject}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#6b8a85' }}>
                            {a.teacher_name} · 마감 {new Date(a.due_date).toLocaleDateString('ko-KR')} · 배점 {a.max_score}점
                          </div>
                        </div>
                        {!a.is_submitted && (
                          <div style={{ textAlign: 'center', minWidth: 60, color: dday === 0 ? '#ef4444' : dday < 0 ? '#aab8b5' : dday <= 3 ? '#f97316' : '#6b8a85', fontWeight: 800, fontSize: 14 }}>
                            {dday === 0 ? 'D-Day' : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}
                          </div>
                        )}
                        {a.is_submitted ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontWeight: 600, fontSize: 13 }}>
                            <Check size={16} /> 제출 완료
                          </div>
                        ) : !isTeacher ? (
                          <button className="btn btn-primary" onClick={() => setSubmitTarget(a)} style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }}>
                            <Upload size={14} /> 제출하기
                          </button>
                        ) : null}
                        {/* 교사: 제출 목록 토글 */}
                        {isTeacher && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleViewSubs(a)}
                            style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}
                          >
                            제출 목록 {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}
                      </div>

                      {/* 교사용 제출 목록 */}
                      {isExpanded && viewSubs && (
                        <div style={{ marginTop: 16, borderTop: '1px solid #e8f0ee', paddingTop: 14 }}>
                          {viewSubs.subs.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#aab8b5', textAlign: 'center' }}>제출한 학생이 없습니다</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {viewSubs.subs.map(s => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f6faf9', borderRadius: 8 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e2b' }}>학생 #{s.student_id}</div>
                                    <div style={{ fontSize: 12, color: '#6b8a85', marginTop: 2 }}>{s.content || '(내용 없음)'}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {s.score != null ? (
                                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1a7a6e' }}>{s.score}점</span>
                                    ) : (
                                      <>
                                        <input
                                          type="number"
                                          placeholder="점수"
                                          value={grading[s.id] ?? ''}
                                          onChange={e => setGrading(prev => ({ ...prev, [s.id]: e.target.value }))}
                                          style={{ width: 72, padding: '5px 8px', border: '1.5px solid #e2e8e6', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}
                                          min={0} max={a.max_score}
                                        />
                                        <button
                                          className="btn btn-primary"
                                          style={{ padding: '6px 12px', fontSize: 12 }}
                                          onClick={() => handleGrade(s.id)}
                                          disabled={!grading[s.id]}
                                        >채점</button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {list.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#aab8b5' }}>
                    {tab === 'pending' ? '미제출 과제가 없습니다 🎉' : '제출한 과제가 없습니다'}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div className="card-header"><span className="card-title">📊 제출 현황</span></div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#6b8a85' }}>전체 진행률</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2e2b' }}>{done.length}/{items.length}</span>
                  </div>
                  <div style={{ height: 8, background: '#e8f0ee', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#1a7a6e', borderRadius: 4, width: items.length ? `${(done.length / items.length) * 100}%` : '0%', transition: 'width 0.5s' }} />
                  </div>
                </div>
                {[
                  { label: '오늘 마감', count: pending.filter(a => getDday(a.due_date) === 0).length, color: '#ef4444', icon: <AlertCircle size={14} /> },
                  { label: '3일 내 마감', count: pending.filter(a => { const d = getDday(a.due_date); return d > 0 && d <= 3 }).length, color: '#f97316', icon: <Clock size={14} /> },
                  { label: '제출 완료', count: done.length, color: '#22c55e', icon: <Check size={14} /> },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f0f4f3' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color }}>
                      {s.icon}<span style={{ fontSize: 13, color: '#3d5a56' }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.count}개</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title">⚠️ 오늘 마감</span></div>
                {pending.filter(a => getDday(a.due_date) === 0).length === 0
                  ? <p style={{ fontSize: 13, color: '#aab8b5', textAlign: 'center', padding: '12px 0' }}>오늘 마감 과제 없음</p>
                  : pending.filter(a => getDday(a.due_date) === 0).map(a => (
                    <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f4f3' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: '#6b8a85' }}>{a.subject} · {a.teacher_name}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}