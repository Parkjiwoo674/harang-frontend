'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { gradesApi, GradeOut } from '@/lib/api'
import { BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const SUBJECTS = ['국어', '수학', '영어', '물리', '역사', '프로그래밍', '체육']
const EXAM_TYPES = ['중간고사', '기말고사', '수행평가']
const SEMESTERS = ['2024-1', '2024-2', '2025-1', '2025-2']

const subjectColors: Record<string, string> = {
  '국어': '#ef4444', '수학': '#8b5cf6', '영어': '#3b82f6',
  '물리': '#f97316', '역사': '#d946ef', '프로그래밍': '#22c55e', '체육': '#14b8a6',
}

function gradeLabel(score: number) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function gradeColor(score: number) {
  if (score >= 90) return '#22c55e'
  if (score >= 80) return '#3b82f6'
  if (score >= 70) return '#f97316'
  if (score >= 60) return '#eab308'
  return '#ef4444'
}

// 과목×시험종류 표 데이터 빌더
function buildTable(grades: GradeOut[]) {
  const map: Record<string, Record<string, GradeOut>> = {}
  grades.forEach(g => {
    if (!map[g.subject]) map[g.subject] = {}
    map[g.subject][g.exam_type || '중간고사'] = g
  })
  return map
}

export default function GradesPage() {
  const { user } = useAuth()
  const [grades, setGrades] = useState<GradeOut[]>([])
  const [loading, setLoading] = useState(true)
  const [semester, setSemester] = useState('2024-2')

  useEffect(() => {
    gradesApi.mine().then(setGrades).finally(() => setLoading(false))
  }, [])

  const filtered = grades.filter(g => g.semester === semester)
  const table = buildTable(filtered)
  const subjects = Object.keys(table)

  // 시험 종류별 평균
  const examAvg = (examType: string) => {
    const scores = subjects.map(s => table[s][examType]?.score).filter(s => s != null) as number[]
    if (!scores.length) return null
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  // 전체 평균
  const totalAvg = filtered.length
    ? Math.round(filtered.reduce((a, b) => a + b.score, 0) / filtered.length)
    : null

  if (loading) return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aab8b5' }}>불러오는 중...</main>
    </div>
  )

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart2 size={24} color="#1a7a6e" /> 성적 조회
            </h1>
            <p>{user?.grade}학년 {user?.class}반 {user?.number}번 · {user?.name}</p>
          </div>
          {/* 학기 선택 */}
          <div style={{ display: 'flex', gap: 6 }}>
            {SEMESTERS.map(s => (
              <button key={s} onClick={() => setSemester(s)} className="btn" style={{
                padding: '7px 14px', fontSize: 13,
                background: semester === s ? '#1a7a6e' : 'white',
                color: semester === s ? 'white' : '#6b8a85',
                border: `1.5px solid ${semester === s ? '#1a7a6e' : '#e2e8e6'}`,
              }}>{s}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#aab8b5' }}>
            <BarChart2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>{semester} 성적이 없습니다</p>
          </div>
        ) : (
          <>
            {/* 요약 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <div className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#6b8a85', marginBottom: 8 }}>전체 평균</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: totalAvg != null ? gradeColor(totalAvg) : '#aab8b5' }}>{totalAvg ?? '-'}점</div>
                <div style={{ fontSize: 13, color: '#aab8b5', marginTop: 4 }}>{totalAvg != null ? gradeLabel(totalAvg) + '등급' : ''}</div>
              </div>
              {EXAM_TYPES.map(et => {
                const avg = examAvg(et)
                return (
                  <div key={et} className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#6b8a85', marginBottom: 8 }}>{et} 평균</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: avg != null ? gradeColor(avg) : '#aab8b5' }}>{avg ?? '-'}점</div>
                    <div style={{ fontSize: 13, color: '#aab8b5', marginTop: 4 }}>{avg != null ? gradeLabel(avg) + '등급' : '미입력'}</div>
                  </div>
                )
              })}
            </div>

            {/* 성적표 표 */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8f0ee', background: '#f6faf9' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2e2b' }}>📋 {semester} 성적표</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f6faf9' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b8a85', borderBottom: '1.5px solid #e8f0ee', whiteSpace: 'nowrap' }}>과목</th>
                      {EXAM_TYPES.map(et => (
                        <th key={et} colSpan={3} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#6b8a85', borderBottom: '1.5px solid #e8f0ee', borderLeft: '1px solid #e8f0ee', whiteSpace: 'nowrap' }}>{et}</th>
                      ))}
                    </tr>
                    <tr style={{ background: '#fafcfc' }}>
                      <th style={{ padding: '8px 16px', borderBottom: '1px solid #e8f0ee' }} />
                      {EXAM_TYPES.map(et => (
                        <>
                          <th key={`${et}-score`} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#aab8b5', borderBottom: '1px solid #e8f0ee', borderLeft: '1px solid #e8f0ee' }}>점수</th>
                          <th key={`${et}-grade`} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#aab8b5', borderBottom: '1px solid #e8f0ee' }}>등급</th>
                          <th key={`${et}-rank`} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#aab8b5', borderBottom: '1px solid #e8f0ee' }}>순위</th>
                        </>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject, i) => {
                      const color = subjectColors[subject] || '#1a7a6e'
                      return (
                        <tr key={subject} style={{ background: i % 2 === 0 ? 'white' : '#fafcfc' }}>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f4f3' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                              <span style={{ fontWeight: 700, fontSize: 14, color: '#1a2e2b' }}>{subject}</span>
                            </div>
                          </td>
                          {EXAM_TYPES.map(et => {
                            const g = table[subject]?.[et]
                            return (
                              <>
                                <td key={`${et}-score`} style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid #f0f4f3', borderLeft: '1px solid #f0f4f3' }}>
                                  {g ? (
                                    <div>
                                      <span style={{ fontSize: 16, fontWeight: 900, color: gradeColor(g.score) }}>{g.score}</span>
                                      {g.prev_score != null && (
                                        <span style={{ fontSize: 10, color: g.score > g.prev_score ? '#22c55e' : g.score < g.prev_score ? '#ef4444' : '#aab8b5', marginLeft: 4 }}>
                                          {g.score > g.prev_score ? `▲${g.score - g.prev_score}` : g.score < g.prev_score ? `▼${g.prev_score - g.score}` : '-'}
                                        </span>
                                      )}
                                    </div>
                                  ) : <span style={{ color: '#e2e8e6' }}>—</span>}
                                </td>
                                <td key={`${et}-grade`} style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid #f0f4f3' }}>
                                  {g ? (
                                    <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 12, fontWeight: 700, background: gradeColor(g.score) + '20', color: gradeColor(g.score) }}>
                                      {gradeLabel(g.score)}
                                    </span>
                                  ) : <span style={{ color: '#e2e8e6' }}>—</span>}
                                </td>
                                <td key={`${et}-rank`} style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid #f0f4f3' }}>
                                  {g?.rank ? (
                                    <span style={{ fontSize: 13, color: '#3d5a56' }}>
                                      {g.rank}<span style={{ fontSize: 10, color: '#aab8b5' }}>/{g.total_students}</span>
                                    </span>
                                  ) : <span style={{ color: '#e2e8e6' }}>—</span>}
                                </td>
                              </>
                            )
                          })}
                        </tr>
                      )
                    })}
                    {/* 평균 행 */}
                    <tr style={{ background: '#f0f9f7', borderTop: '2px solid #e8f0ee' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: 13, color: '#1a7a6e' }}>평균</td>
                      {EXAM_TYPES.map(et => {
                        const avg = examAvg(et)
                        return (
                          <>
                            <td key={`${et}-avg`} colSpan={3} style={{ padding: '12px 10px', textAlign: 'center', borderLeft: '1px solid #e8f0ee' }}>
                              {avg != null ? (
                                <span style={{ fontSize: 15, fontWeight: 800, color: gradeColor(avg) }}>{avg}점</span>
                              ) : <span style={{ color: '#e2e8e6' }}>—</span>}
                            </td>
                          </>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 과목별 점수 바 */}
            <div className="card">
              <div className="card-header"><span className="card-title">📊 과목별 점수 분포</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {subjects.map(subject => {
                  const subjectGrades = filtered.filter(g => g.subject === subject)
                  const color = subjectColors[subject] || '#1a7a6e'
                  return (
                    <div key={subject}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2e2b' }}>{subject}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {EXAM_TYPES.map(et => {
                            const g = table[subject]?.[et]
                            return g ? (
                              <span key={et} style={{ fontSize: 12, color: '#6b8a85' }}>
                                {et.slice(0, 2)} <strong style={{ color: gradeColor(g.score) }}>{g.score}</strong>
                              </span>
                            ) : null
                          })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {EXAM_TYPES.map(et => {
                          const g = table[subject]?.[et]
                          if (!g) return null
                          return (
                            <div key={et} style={{ flex: 1 }}>
                              <div style={{ height: 8, background: '#e8f0ee', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${g.score}%`, background: color, borderRadius: 4, opacity: et === '중간고사' ? 1 : et === '기말고사' ? 0.75 : 0.5 }} />
                              </div>
                              <div style={{ fontSize: 10, color: '#aab8b5', marginTop: 2, textAlign: 'center' }}>{et.slice(0, 2)}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}