'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart2, Save, Search, X } from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const EXAM_TYPES = ['중간고사', '기말고사', '수행평가']
const GRADES_LIST = [1, 2, 3]
const SEMESTERS_LIST = [{ value: 1, label: '1학기' }, { value: 2, label: '2학기' }]
const MAX_RECENT = 8

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('harang_token')
}

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers as any),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '요청 실패')
  }
  return res.json()
}

function getRecentSubjects(): string[] {
  try { return JSON.parse(localStorage.getItem('harang_recent_subjects') || '[]') }
  catch { return [] }
}
function saveRecentSubject(subject: string) {
  const list = getRecentSubjects().filter(s => s !== subject)
  list.unshift(subject)
  localStorage.setItem('harang_recent_subjects', JSON.stringify(list.slice(0, MAX_RECENT)))
}

function rankGrade(rank: number, total: number) {
  const pct = (rank / total) * 100
  if (pct <= 4) return 1
  if (pct <= 11) return 2
  if (pct <= 23) return 3
  if (pct <= 40) return 4
  if (pct <= 60) return 5
  if (pct <= 77) return 6
  if (pct <= 89) return 7
  if (pct <= 96) return 8
  return 9
}

interface StudentWithGrades {
  id: number
  name: string
  number: number
  grades: any[]
}

const dropdownStyle: React.CSSProperties = {
  padding: '6px 28px 6px 10px',
  fontSize: 14,
  border: '1px solid #b0bec5',
  borderRadius: 4,
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontWeight: 400,
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  minWidth: 90,
}
const thStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
  background: '#ecf0f1', border: '1px solid #bdc3c7', textAlign: 'center', whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  padding: '7px 10px', fontSize: 13, border: '1px solid var(--border-card)',
  textAlign: 'center', color: 'var(--text-primary)', background: 'var(--bg-card)',
}

// ────────────────────────────────────────────
// 입력 탭
// ────────────────────────────────────────────
function InputTab({ user }: { user: any }) {
  const [selectedGrade, setSelectedGrade] = useState(user?.grade || 1)
  const [selectedSemester, setSelectedSemester] = useState(1)
  const [subject, setSubject] = useState('')
  const [subjectInput, setSubjectInput] = useState('')
  const [recentSubjects, setRecentSubjects] = useState<string[]>([])
  const [examType, setExamType] = useState(EXAM_TYPES[0])
  const [examName, setExamName] = useState('')
  const [students, setStudents] = useState<StudentWithGrades[]>([])
  const [scores, setScores] = useState<Record<number, string>>({})
  const [queried, setQueried] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const semester = `${selectedGrade}-${selectedSemester}`

  useEffect(() => { setRecentSubjects(getRecentSubjects()) }, [])

  const refreshScores = (studs: StudentWithGrades[], subj: string, exam: string, sem: string) => {
    const existing: Record<number, string> = {}
    studs.forEach(s => {
      const g = s.grades.find((g: any) => g.subject === subj && g.exam_name === (examName || exam) && g.semester === sem)
      existing[s.id] = g ? String(g.score) : ''
    })
    setScores(existing)
  }

  useEffect(() => {
    if (queried) refreshScores(students, subject, examType, semester)
  }, [subject, examType])

  const handleSubjectConfirm = () => {
    const val = subjectInput.trim()
    if (!val) return
    setSubject(val)
    saveRecentSubject(val)
    setRecentSubjects(getRecentSubjects())
  }

  const handleSearch = async () => {
    if (!subject) { alert('과목을 입력해주세요.'); return }
    setLoading(true)
    try {
      const data = await api(`/api/grades/class?semester=${semester}`)
      setStudents(data.students)
      refreshScores(data.students, subject, examType, semester)
      setQueried(true)
    } catch (e: any) { alert(e.message) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const scoreList = students
        .filter(s => scores[s.id] !== '' && scores[s.id] != null)
        .map(s => ({ student_id: s.id, score: Number(scores[s.id]) }))
      if (scoreList.length === 0) { alert('입력된 점수가 없습니다.'); return }
      await api('/api/grades/class/batch', {
        method: 'POST',
        body: JSON.stringify({ subject, exam_type: examType, exam_name: examName || examType, semester, scores: scoreList }),
      })
      setSavedMsg(`✅ ${subject} ${examName || examType} 성적 저장 완료`)
      setTimeout(() => setSavedMsg(''), 3000)
      await handleSearch()
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  const filledScores = Object.values(scores).filter(v => v !== '').map(Number).filter(n => !isNaN(n))
  const avg = filledScores.length ? Math.round(filledScores.reduce((a, b) => a + b, 0) / filledScores.length) : null
  const max = filledScores.length ? Math.max(...filledScores) : null
  const min = filledScores.length ? Math.min(...filledScores) : null

  return (
    <>
      {/* 조회 바 */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 6, padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>학년</label>
            <select value={selectedGrade} onChange={e => setSelectedGrade(Number(e.target.value))} style={dropdownStyle}>
              {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>학기</label>
            <select value={selectedSemester} onChange={e => setSelectedSemester(Number(e.target.value))} style={dropdownStyle}>
              {SEMESTERS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>시험종류</label>
            <select value={examType} onChange={e => { setExamType(e.target.value); setExamName('') }} style={{ ...dropdownStyle, minWidth: 110 }}>
              {EXAM_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>과목</label>
              <input
                type="text" value={subjectInput}
                onChange={e => setSubjectInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubjectConfirm()}
                placeholder="과목명 입력"
                style={{ padding: '6px 10px', fontSize: 14, border: `1px solid ${subject ? '#1a5276' : '#b0bec5'}`, borderRadius: 4, fontFamily: 'inherit', outline: 'none', width: 160 }}
              />
              <button onClick={handleSubjectConfirm} style={{ padding: '6px 12px', fontSize: 13, background: '#f0f0f0', border: '1px solid #b0bec5', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>확인</button>
              {subject && (
                <span style={{ fontSize: 13, color: '#1a5276', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  [{subject}]
                  <button onClick={() => { setSubject(''); setSubjectInput('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0 }}><X size={12} /></button>
                </span>
              )}
            </div>
            {recentSubjects.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingLeft: 36 }}>
                <span style={{ fontSize: 11, color: '#aaa', alignSelf: 'center' }}>최근:</span>
                {recentSubjects.map(s => (
                  <button key={s} onClick={() => { setSubject(s); setSubjectInput(s) }} style={{
                    padding: '2px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                    background: subject === s ? '#1a5276' : '#f0f4f8',
                    color: subject === s ? 'white' : '#555',
                    border: `1px solid ${subject === s ? '#1a5276' : '#ccc'}`, borderRadius: 3,
                  }}>{s}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSearch} disabled={loading} style={{ padding: '8px 24px', background: '#1a5276', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            <Search size={14} /> {loading ? '조회 중...' : '조회'}
          </button>
        </div>
      </div>

      {!queried ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-card)', padding: '60px 0', textAlign: 'center', color: '#888', fontSize: 14 }}>
          <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>학년, 학기, 과목, 시험종류를 선택 후 조회하세요.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-card)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-card)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                성적 입력 — {selectedGrade}학년 {selectedSemester}학기 {subject} {examName || examType}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{user?.name} 선생님 담임반 · {students.length}명</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {savedMsg && <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>{savedMsg}</span>}
              <button onClick={handleSave} disabled={saving || filledScores.length === 0} style={{ padding: '8px 20px', background: '#1a5276', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', opacity: saving || filledScores.length === 0 ? 0.5 : 1 }}>
                <Save size={14} /> {saving ? '저장 중...' : `${filledScores.length}명 저장`}
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 500 }}>
              <thead>
                <tr>
                  <th style={thStyle}>번호</th>
                  <th style={thStyle}>이름</th>
                  <th style={{ ...thStyle, width: 140 }}>점수 입력 (0~100)</th>
                  <th style={thStyle}>등급</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const score = scores[s.id]
                  const numScore = score !== '' && score != null ? Number(score) : null
                  const isValid = numScore != null && !isNaN(numScore) && numScore >= 0 && numScore <= 100
                  const isInvalid = score !== '' && score != null && !isValid
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                      <td style={{ ...tdStyle, color: '#888', width: 60 }}>{s.number}</td>
                      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ ...tdStyle, padding: '6px 10px' }}>
                        <input type="number" min={0} max={100} value={score ?? ''} onChange={e => setScores(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="—"
                          style={{ width: '100%', padding: '5px 8px', textAlign: 'center', border: `1px solid ${isInvalid ? '#fecaca' : isValid ? '#bbf7d0' : '#b0bec5'}`, borderRadius: 3, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', outline: 'none', background: isInvalid ? '#fef2f2' : isValid ? '#f0fdf4' : 'white', color: isValid ? '#1a7a6e' : '#1a2e2b' }}
                        />
                      </td>
                      <td style={tdStyle}>
                        {isValid ? (
                          <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 12, fontWeight: 700, background: numScore! >= 90 ? '#e8f8f0' : numScore! >= 80 ? '#eaf0fb' : numScore! >= 70 ? '#fff4e5' : numScore! >= 60 ? '#fefce8' : '#fef0f0', color: numScore! >= 90 ? '#1a7a6e' : numScore! >= 80 ? '#1a5276' : numScore! >= 70 ? '#e67e22' : numScore! >= 60 ? '#b7950b' : '#c0392b' }}>
                            {numScore! >= 90 ? 'A' : numScore! >= 80 ? 'B' : numScore! >= 70 ? 'C' : numScore! >= 60 ? 'D' : 'E'}
                          </span>
                        ) : <span style={{ color: '#ccc' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-card)', background: 'var(--bg)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: '입력 완료', value: `${filledScores.length}명`, color: '#1a7a6e' },
              { label: '미입력', value: `${students.length - filledScores.length}명`, color: '#888' },
              { label: '반 평균', value: avg != null ? `${avg}점` : '-', color: '#1a5276' },
              { label: '최고점', value: max != null ? `${max}점` : '-', color: '#c0392b' },
              { label: '최저점', value: min != null ? `${min}점` : '-', color: '#7f8c8d' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#888' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ────────────────────────────────────────────
// 조회 탭
// ────────────────────────────────────────────
function ViewTab() {
  const [selectedGrade, setSelectedGrade] = useState(1)
  const [selectedSemester, setSelectedSemester] = useState(1)
  const [classNum, setClassNum] = useState(1)
  const [subjectFilter, setSubjectFilter] = useState('')
  const [examTypeFilter, setExamTypeFilter] = useState('')
  const [students, setStudents] = useState<StudentWithGrades[]>([])
  const [queried, setQueried] = useState(false)
  const [loading, setLoading] = useState(false)

  const semester = `${selectedGrade}-${selectedSemester}`

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        grade: String(selectedGrade),
        class_num: String(classNum),
        semester,
        ...(subjectFilter && { subject: subjectFilter }),
        ...(examTypeFilter && { exam_type: examTypeFilter }),
      })
      const data = await api(`/api/grades/view?${params}`)
      setStudents(data.students)
      setQueried(true)
    } catch (e: any) { alert(e.message) }
    finally { setLoading(false) }
  }

  // 조회된 과목 목록 추출
  const allGrades = students.flatMap(s => s.grades)
  const subjects = [...new Set(allGrades.map(g => g.subject))]
  const examTypes = [...new Set(allGrades.map(g => g.exam_type))]

  return (
    <>
      {/* 조회 바 */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 6, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>학년</label>
          <select value={selectedGrade} onChange={e => setSelectedGrade(Number(e.target.value))} style={dropdownStyle}>
            {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>학기</label>
          <select value={selectedSemester} onChange={e => setSelectedSemester(Number(e.target.value))} style={dropdownStyle}>
            {SEMESTERS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>반</label>
          <select value={classNum} onChange={e => setClassNum(Number(e.target.value))} style={dropdownStyle}>
            {[1, 2, 3, 4].map(c => <option key={c} value={c}>{c}반</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>과목</label>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} style={{ ...dropdownStyle, minWidth: 100 }}>
            <option value="">전체</option>
            {getRecentSubjects().map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>시험종류</label>
          <select value={examTypeFilter} onChange={e => setExamTypeFilter(e.target.value)} style={{ ...dropdownStyle, minWidth: 110 }}>
            <option value="">전체</option>
            {EXAM_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <button onClick={handleSearch} disabled={loading} style={{ marginLeft: 'auto', padding: '8px 24px', background: '#1a5276', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <Search size={14} /> {loading ? '조회 중...' : '조회'}
        </button>
      </div>

      {!queried ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-card)', padding: '60px 0', textAlign: 'center', color: '#888', fontSize: 14 }}>
          <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>조회 조건을 선택 후 조회하세요.</p>
        </div>
      ) : allGrades.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-card)', padding: '60px 0', textAlign: 'center', color: '#888', fontSize: 14 }}>
          입력된 성적이 없습니다.
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-card)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-card)', background: 'var(--bg)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              성적 조회 — {selectedGrade}학년 {selectedSemester}학기 {classNum}반
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{students.length}명</div>
          </div>
          <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={thStyle}>번호</th>
                  <th style={thStyle}>이름</th>
                  {subjects.flatMap(subj =>
                    examTypes.map(et => (
                      <th key={`${subj}-${et}`} style={thStyle}>{subj}<br /><span style={{ fontWeight: 400, fontSize: 11 }}>{et}</span></th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                    <td style={{ ...tdStyle, color: '#888', width: 50 }}>{s.number}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>{s.name}</td>
                    {subjects.flatMap(subj =>
                      examTypes.map(et => {
                        const g = s.grades.find((g: any) => g.subject === subj && g.exam_type === et)
                        const rg = g?.rank && g?.total_students ? rankGrade(g.rank, g.total_students) : null
                        return (
                          <td key={`${subj}-${et}`} style={tdStyle}>
                            {g ? (
                              <div>
                                <span style={{ fontWeight: 700, fontSize: 14, color: g.score >= 90 ? '#1a7a6e' : g.score >= 60 ? '#1a2e2b' : '#c0392b' }}>{g.score}</span>
                                {rg != null && g.total_students >= 25 && (
                                  <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>({rg}등급)</span>
                                )}
                              </div>
                            ) : <span style={{ color: '#ddd' }}>—</span>}
                          </td>
                        )
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-card)', background: 'var(--bg)' }}>
            <p style={{ fontSize: 11, color: '#888', margin: 0 }}>※ 석차등급은 수강자수 25명 이상일 때 표시됩니다.</p>
          </div>
        </div>
      )}
    </>
  )
}

// ────────────────────────────────────────────
// 메인 페이지
// ────────────────────────────────────────────
export default function TeacherGradesPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'input' | 'view'>('input')

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 24px', fontSize: 14, fontWeight: active ? 700 : 400,
    color: active ? '#1a5276' : '#888', background: 'none', border: 'none',
    borderBottom: active ? '2.5px solid #1a5276' : '2.5px solid transparent',
    cursor: 'pointer', fontFamily: 'inherit',
  })

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1, background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <BarChart2 size={22} color="#1a7a6e" />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>성적 관리</h1>
          <div style={{ marginLeft: 16, borderBottom: '1px solid var(--border-card)', display: 'flex' }}>
            <button style={tabStyle(tab === 'input')} onClick={() => setTab('input')}>성적 입력</button>
            <button style={tabStyle(tab === 'view')} onClick={() => setTab('view')}>성적 조회</button>
          </div>
        </div>

        {tab === 'input' ? <InputTab user={user} /> : <ViewTab />}
      </main>
    </div>
  )
}