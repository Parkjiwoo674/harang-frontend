'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { Save, Search } from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const EXAM_TYPES = ['중간고사', '기말고사', '수행평가']
const GRADES_LIST = [1, 2, 3]
const SEMESTERS_LIST = [{ value: 1, label: '1학기' }, { value: 2, label: '2학기' }]

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
  padding: '8px 10px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-primary)',
  background: '#ecf0f1',
  border: '1px solid #bdc3c7',
  textAlign: 'center',
  whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  padding: '7px 10px',
  fontSize: 13,
  border: '1px solid var(--border-card)',
  textAlign: 'center',
  color: 'var(--text-primary)',
  background: 'var(--bg-card)',
}

export default function SubjectTeacherGradesPage() {
  const { user } = useAuth()
  const [selectedGrade, setSelectedGrade] = useState(1)
  const [selectedSemester, setSelectedSemester] = useState(1)
  const [classNum, setClassNum] = useState(1)
  const [examType, setExamType] = useState(EXAM_TYPES[0])
  const [students, setStudents] = useState<StudentWithGrades[]>([])
  const [scores, setScores] = useState<Record<number, string>>({})
  const [queried, setQueried] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const semester = `${selectedGrade}-${selectedSemester}`

  const refreshScores = (studs: StudentWithGrades[], exam: string, sem: string) => {
    const existing: Record<number, string> = {}
    studs.forEach(s => {
      const g = s.grades.find((g: any) => g.exam_type === exam && g.semester === sem)
      existing[s.id] = g ? String(g.score) : ''
    })
    setScores(existing)
  }

  useEffect(() => {
    if (queried) refreshScores(students, examType, semester)
  }, [examType])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const data = await api(`/api/grades/subject/${selectedGrade}/${classNum}?semester=${semester}`)
      setStudents(data.students)
      refreshScores(data.students, examType, semester)
      setQueried(true)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const scoreList = students
        .filter(s => scores[s.id] !== '' && scores[s.id] != null)
        .map(s => ({ student_id: s.id, score: Number(scores[s.id]) }))
      if (scoreList.length === 0) { alert('입력된 점수가 없습니다.'); return }
      await api('/api/grades/subject', {
        method: 'POST',
        body: JSON.stringify({ grade: selectedGrade, class_num: classNum, exam_type: examType, semester, scores: scoreList }),
      })
      setSavedMsg(`✅ ${user?.subject} ${examType} 저장 완료`)
      setTimeout(() => setSavedMsg(''), 3000)
      await handleSearch()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filledScores = Object.values(scores).filter(v => v !== '').map(Number).filter(n => !isNaN(n))
  const avg = filledScores.length ? Math.round(filledScores.reduce((a, b) => a + b, 0) / filledScores.length) : null
  const max = filledScores.length ? Math.max(...filledScores) : null
  const min = filledScores.length ? Math.min(...filledScores) : null

  if (!user?.subject) return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <Sidebar />
      <main className="main-layout">
        <div className="card" style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>담당 과목이 지정되지 않았습니다.</p>
        </div>
      </main>
    </div>
  )

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1, background: 'var(--bg)' }}>

        {/* 상단 조회 바 */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 6, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>학년</label>
            <select value={selectedGrade} onChange={e => setSelectedGrade(Number(e.target.value))} style={dropdownStyle}>
              {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>학기</label>
            <select value={selectedSemester} onChange={e => setSelectedSemester(Number(e.target.value))} style={dropdownStyle}>
              {SEMESTERS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>반</label>
            <select value={classNum} onChange={e => setClassNum(Number(e.target.value))} style={dropdownStyle}>
              {[1, 2, 3, 4].map(c => <option key={c} value={c}>{c}반</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>시험종류</label>
            <select value={examType} onChange={e => setExamType(e.target.value)} style={{ ...dropdownStyle, minWidth: 110 }}>
              {EXAM_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <button onClick={handleSearch} disabled={loading} style={{
            marginLeft: 'auto', padding: '8px 24px', background: '#1a5276', color: 'white',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
          }}>
            <Search size={14} /> {loading ? '조회 중...' : '조회'}
          </button>
        </div>

        {!queried ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-card)', padding: '60px 0', textAlign: 'center', color: '#888', fontSize: 14 }}>
            <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>학년, 학기, 반, 시험종류를 선택 후 조회하세요.</p>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-card)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-card)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  성적 입력 — {selectedGrade}학년 {selectedSemester}학기 {classNum}반 {user?.subject} {examType}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{user?.name} 선생님 · {students.length}명</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {savedMsg && <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>{savedMsg}</span>}
                <button onClick={handleSave} disabled={saving || filledScores.length === 0} style={{
                  padding: '8px 20px', background: '#1a5276', color: 'white',
                  border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                  opacity: saving || filledScores.length === 0 ? 0.5 : 1,
                }}>
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
                          <input
                            type="number" min={0} max={100}
                            value={score ?? ''}
                            onChange={e => setScores(prev => ({ ...prev, [s.id]: e.target.value }))}
                            placeholder="—"
                            style={{
                              width: '100%', padding: '5px 8px', textAlign: 'center',
                              border: `1px solid ${isInvalid ? '#fecaca' : isValid ? '#bbf7d0' : '#b0bec5'}`,
                              borderRadius: 3, fontSize: 14, fontWeight: 700,
                              fontFamily: 'inherit', outline: 'none',
                              background: isInvalid ? '#fef2f2' : isValid ? '#f0fdf4' : 'white',
                              color: isValid ? '#1a7a6e' : '#1a2e2b',
                            }}
                          />
                        </td>
                        <td style={tdStyle}>
                          {isValid ? (
                            <span style={{
                              padding: '2px 8px', borderRadius: 3, fontSize: 12, fontWeight: 700,
                              background: numScore! >= 90 ? '#e8f8f0' : numScore! >= 80 ? '#eaf0fb' : numScore! >= 70 ? '#fff4e5' : numScore! >= 60 ? '#fefce8' : '#fef0f0',
                              color: numScore! >= 90 ? '#1a7a6e' : numScore! >= 80 ? '#1a5276' : numScore! >= 70 ? '#e67e22' : numScore! >= 60 ? '#b7950b' : '#c0392b',
                            }}>
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
      </main>
    </div>
  )
}