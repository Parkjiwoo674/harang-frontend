'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart2, Save, ChevronDown } from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const SUBJECTS = ['국어', '수학', '영어', '물리', '역사', '프로그래밍', '체육']
const EXAM_TYPES = ['중간고사', '기말고사', '수행평가']
const SEMESTERS = ['2024-1', '2024-2', '2025-1', '2025-2']

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

export default function TeacherGradesPage() {
  const { user } = useAuth()
  const [semester, setSemester] = useState('2024-2')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [examType, setExamType] = useState(EXAM_TYPES[0])
  const [students, setStudents] = useState<StudentWithGrades[]>([])
  const [scores, setScores] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const loadClass = async () => {
    setLoading(true)
    try {
      const data = await api(`/api/grades/class?semester=${semester}`)
      setStudents(data.students)
      // 기존 점수 불러오기
      const existing: Record<number, string> = {}
      data.students.forEach((s: StudentWithGrades) => {
        const g = s.grades.find((g: any) => g.subject === subject && g.exam_type === examType && g.semester === semester)
        if (g) existing[s.id] = String(g.score)
      })
      setScores(existing)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClass()
  }, [semester])

  // 과목/시험종류 변경 시 기존 점수 업데이트
  useEffect(() => {
    const existing: Record<number, string> = {}
    students.forEach(s => {
      const g = s.grades.find((g: any) => g.subject === subject && g.exam_type === examType && g.semester === semester)
      if (g) existing[s.id] = String(g.score)
      else existing[s.id] = ''
    })
    setScores(existing)
  }, [subject, examType, students])

  const handleSave = async () => {
    setSaving(true)
    try {
      const scoreList = students
        .filter(s => scores[s.id] !== '' && scores[s.id] != null)
        .map(s => ({ student_id: s.id, score: Number(scores[s.id]) }))

      if (scoreList.length === 0) {
        alert('입력된 점수가 없습니다.')
        return
      }

      await api('/api/grades/class/batch', {
        method: 'POST',
        body: JSON.stringify({ subject, exam_type: examType, semester, scores: scoreList }),
      })

      setSavedMsg(`✅ ${subject} ${examType} 성적 저장 완료`)
      setTimeout(() => setSavedMsg(''), 3000)
      await loadClass()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  // 전체 입력 점수 평균
  const inputScores = students.map(s => Number(scores[s.id])).filter(s => !isNaN(s) && scores[students.find(st => st.id === students.find(st2 => st2.id)?.id)?.id ?? 0] !== '')
  const filledScores = Object.values(scores).filter(v => v !== '').map(Number).filter(n => !isNaN(n))
  const avg = filledScores.length ? Math.round(filledScores.reduce((a, b) => a + b, 0) / filledScores.length) : null
  const max = filledScores.length ? Math.max(...filledScores) : null
  const min = filledScores.length ? Math.min(...filledScores) : null

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart2 size={24} color="#1a7a6e" /> 성적 입력
            </h1>
            <p>{user?.name} 선생님 담임반 성적 관리</p>
          </div>
          {savedMsg && (
            <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
              {savedMsg}
            </div>
          )}
        </div>

        {/* 필터 */}
        <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b8a85', display: 'block', marginBottom: 6 }}>학기</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {SEMESTERS.map(s => (
                  <button key={s} onClick={() => setSemester(s)} className="btn" style={{
                    padding: '6px 12px', fontSize: 12,
                    background: semester === s ? '#1a7a6e' : 'white',
                    color: semester === s ? 'white' : '#6b8a85',
                    border: `1.5px solid ${semester === s ? '#1a7a6e' : '#e2e8e6'}`,
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b8a85', display: 'block', marginBottom: 6 }}>과목</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => setSubject(s)} className="btn" style={{
                    padding: '6px 12px', fontSize: 12,
                    background: subject === s ? '#1a7a6e' : 'white',
                    color: subject === s ? 'white' : '#6b8a85',
                    border: `1.5px solid ${subject === s ? '#1a7a6e' : '#e2e8e6'}`,
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b8a85', display: 'block', marginBottom: 6 }}>시험 종류</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {EXAM_TYPES.map(e => (
                  <button key={e} onClick={() => setExamType(e)} className="btn" style={{
                    padding: '6px 12px', fontSize: 12,
                    background: examType === e ? '#6366f1' : 'white',
                    color: examType === e ? 'white' : '#6b8a85',
                    border: `1.5px solid ${examType === e ? '#6366f1' : '#e2e8e6'}`,
                  }}>{e}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20 }}>
          {/* 성적 입력 표 */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8f0ee', background: '#f6faf9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2e2b' }}>
                {subject} · {examType} · {semester}
              </span>
              <span style={{ fontSize: 12, color: '#aab8b5' }}>{students.length}명</span>
            </div>
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#aab8b5' }}>불러오는 중...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafcfc' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b8a85', borderBottom: '1px solid #e8f0ee', width: 60 }}>번호</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b8a85', borderBottom: '1px solid #e8f0ee' }}>이름</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#6b8a85', borderBottom: '1px solid #e8f0ee', width: 120 }}>점수 (0~100)</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#6b8a85', borderBottom: '1px solid #e8f0ee', width: 80 }}>등급</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const score = scores[s.id]
                    const numScore = score !== '' && score != null ? Number(score) : null
                    const isValid = numScore != null && !isNaN(numScore) && numScore >= 0 && numScore <= 100
                    const isInvalid = score !== '' && score != null && !isValid

                    return (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafcfc' }}>
                        <td style={{ padding: '10px 16px', fontSize: 14, color: '#aab8b5', borderBottom: '1px solid #f0f4f3', fontWeight: 600 }}>{s.number}</td>
                        <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 700, color: '#1a2e2b', borderBottom: '1px solid #f0f4f3' }}>{s.name}</td>
                        <td style={{ padding: '8px 16px', borderBottom: '1px solid #f0f4f3' }}>
                          <input
                            type="number"
                            min={0} max={100}
                            value={score ?? ''}
                            onChange={e => setScores(prev => ({ ...prev, [s.id]: e.target.value }))}
                            placeholder="점수 입력"
                            style={{
                              width: '100%', padding: '7px 10px', textAlign: 'center',
                              border: `1.5px solid ${isInvalid ? '#fecaca' : isValid ? '#bbf7d0' : '#e2e8e6'}`,
                              borderRadius: 7, fontSize: 14, fontWeight: 700,
                              fontFamily: 'inherit', outline: 'none',
                              background: isInvalid ? '#fef2f2' : isValid ? '#f0fdf4' : 'white',
                              color: isValid ? '#22c55e' : '#1a2e2b',
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center', borderBottom: '1px solid #f0f4f3' }}>
                          {isValid ? (
                            <span style={{
                              padding: '3px 10px', borderRadius: 5, fontSize: 13, fontWeight: 700,
                              background: numScore! >= 90 ? '#f0fdf4' : numScore! >= 80 ? '#eff6ff' : numScore! >= 70 ? '#fff7ed' : numScore! >= 60 ? '#fefce8' : '#fef2f2',
                              color: numScore! >= 90 ? '#22c55e' : numScore! >= 80 ? '#3b82f6' : numScore! >= 70 ? '#f97316' : numScore! >= 60 ? '#eab308' : '#ef4444',
                            }}>
                              {numScore! >= 90 ? 'A' : numScore! >= 80 ? 'B' : numScore! >= 70 ? 'C' : numScore! >= 60 ? 'D' : 'F'}
                            </span>
                          ) : <span style={{ color: '#e2e8e6' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #e8f0ee', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || filledScores.length === 0}
                style={{ padding: '10px 28px', fontSize: 14, gap: 8 }}
              >
                <Save size={15} /> {saving ? '저장 중...' : `${filledScores.length}명 성적 저장`}
              </button>
            </div>
          </div>

          {/* 통계 패널 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">📊 입력 현황</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '입력 완료', value: `${filledScores.length}명`, color: '#22c55e' },
                  { label: '미입력', value: `${students.length - filledScores.length}명`, color: '#aab8b5' },
                  { label: '반 평균', value: avg != null ? `${avg}점` : '-', color: '#1a7a6e' },
                  { label: '최고점', value: max != null ? `${max}점` : '-', color: '#3b82f6' },
                  { label: '최저점', value: min != null ? `${min}점` : '-', color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f4f3' }}>
                    <span style={{ fontSize: 13, color: '#6b8a85' }}>{s.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">🏷️ 등급 분포</span></div>
              {['A (90↑)', 'B (80↑)', 'C (70↑)', 'D (60↑)', 'F (60↓)'].map((label, i) => {
                const min = [90, 80, 70, 60, 0][i]
                const max = [100, 89, 79, 69, 59][i]
                const count = filledScores.filter(s => s >= min && s <= max).length
                const pct = filledScores.length ? Math.round(count / filledScores.length * 100) : 0
                const colors = ['#22c55e', '#3b82f6', '#f97316', '#eab308', '#ef4444']
                return (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#3d5a56', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: colors[i] }}>{count}명 ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: '#e8f0ee', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colors[i], borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}