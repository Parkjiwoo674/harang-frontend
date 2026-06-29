'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { gradesApi, GradeOut } from '@/lib/api'
import { Search } from 'lucide-react'

const GRADES_LIST = [1, 2, 3]
const SEMESTERS_LIST = [{ value: 1, label: '1학기' }, { value: 2, label: '2학기' }]
const EXAM_TYPE_FILTER = [
  { value: 'all', label: '전체' },
  { value: '중간고사', label: '중간고사' },
  { value: '기말고사', label: '기말고사' },
  { value: '수행평가', label: '수행평가' },
]

function gradeLabel(score: number, subject?: string) {
  const is3tier = ['체육', '미술', '음악'].includes(subject || '')
  if (is3tier) {
    if (score >= 80) return 'A'
    if (score >= 60) return 'B'
    return 'C'
  }
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'E'
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
  minWidth: 80,
}

// 나이스 스타일 표 색상
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
const tdLeftStyle: React.CSSProperties = { ...tdStyle, textAlign: 'left', fontWeight: 600 }

interface Row {
  subject: string
  examType: string
  examName: string
  score: number
  rank?: number
  total_students?: number
  prev_score?: number | null
}

const EXAM_ORDER = ['중간고사', '기말고사', '수행평가']

function buildRows(grades: GradeOut[], examTypeFilter: string): Record<string, Row[]> {
  const filtered = examTypeFilter === 'all' ? grades : grades.filter(g => g.exam_type === examTypeFilter)
  const map: Record<string, Row[]> = {}
  filtered.forEach(g => {
    if (!map[g.subject]) map[g.subject] = []
    map[g.subject].push({
      subject: g.subject,
      examType: g.exam_type || '중간고사',
      examName: (g as any).exam_name || g.exam_type || '중간고사',
      score: g.score,
      rank: g.rank,
      total_students: g.total_students,
      prev_score: g.prev_score,
    })
  })
  // 중간고사 → 기말고사 → 수행평가 순 정렬
  Object.keys(map).forEach(subj => {
    map[subj].sort((a, b) => EXAM_ORDER.indexOf(a.examType) - EXAM_ORDER.indexOf(b.examType))
  })
  return map
}

export default function GradesPage() {
  const { user } = useAuth()
  const [selectedGrade, setSelectedGrade] = useState(user?.grade || 1)
  const [selectedSemester, setSelectedSemester] = useState(1)
  const [examTypeFilter, setExamTypeFilter] = useState('all')
  const [grades, setGrades] = useState<GradeOut[]>([])
  const [queried, setQueried] = useState(false)
  const [loading, setLoading] = useState(false)

  const semester = `${selectedGrade}-${selectedSemester}`

  const handleSearch = async () => {
    setLoading(true)
    try {
      const all = await gradesApi.mine()
      setGrades(all.filter((g: GradeOut) => g.semester === semester))
      setQueried(true)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const table = buildRows(grades, examTypeFilter)
  const subjects = Object.keys(table)

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1, background: 'var(--bg)' }}>

        {/* 상단 조회 바 — 나이스 스타일 */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 6, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
            <label style={{ fontSize: 13, color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>성적기준</label>
            <select value={examTypeFilter} onChange={e => setExamTypeFilter(e.target.value)} style={{ ...dropdownStyle, minWidth: 100 }}>
              {EXAM_TYPE_FILTER.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              marginLeft: 'auto',
              padding: '8px 24px',
              background: '#1a5276',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
            }}
          >
            <Search size={14} /> {loading ? '조회 중...' : '조회'}
          </button>
        </div>

        {!queried ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-card)' }}>
            <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>학년, 학기, 성적기준을 선택 후 조회하세요.</p>
          </div>
        ) : grades.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-card)', padding: '60px 0', textAlign: 'center', color: '#888', fontSize: 14 }}>
            {selectedGrade}학년 {selectedSemester}학기 성적이 없습니다.
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-card)', overflow: 'hidden' }}>
            {/* 타이틀 */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-card)', background: 'var(--bg)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                성적 - {selectedGrade}학년 {selectedSemester}학기 {examTypeFilter !== 'all' ? examTypeFilter : '전체'}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {user?.grade}학년 {user?.class}반 {user?.number}번 · {user?.name}
              </div>
            </div>

            {/* 나이스 성적표 */}
            <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>과목</th>
                    <th style={thStyle}>구분</th>
                    <th style={thStyle}>고사/영역명</th>
                    <th style={thStyle}>받은 점수</th>
                    <th style={thStyle}>원점수</th>
                    <th style={thStyle}>성취도</th>
                    <th style={thStyle}>석차등급</th>
                    <th style={thStyle}>석차(동석차수)/수강자수</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => {
                    const rows = table[subject]
                    // 원점수: 각 점수의 가중 합계 (단순 평균으로 대체)
                    const rawScore = Math.round(rows.reduce((a, b) => a + b.score, 0) / rows.length)
                    const achievement = gradeLabel(rawScore, subject)
                    const rankRow = rows.find(r => r.rank != null)
                    const rankGradeVal = rankRow ? rankGrade(rankRow.rank!, rankRow.total_students!) : null

                    return rows.map((row, i) => (
                      <tr key={`${subject}-${i}`} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                        {i === 0 && (
                          <td rowSpan={rows.length} style={{ ...tdLeftStyle, verticalAlign: 'middle', background: 'var(--bg)', fontWeight: 700, fontSize: 13 }}>
                            {subject}
                          </td>
                        )}
                        <td style={tdStyle}>{row.examType === '수행평가' ? '수행' : '지필'}</td>
                        <td style={tdStyle}>{row.examName}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: row.score >= 90 ? '#1a7a6e' : row.score >= 60 ? '#2c3e50' : '#c0392b' }}>
                          {row.score.toFixed(2)}
                        </td>
                        {i === 0 && (
                          <>
                            <td rowSpan={rows.length} style={{ ...tdStyle, verticalAlign: 'middle', fontWeight: 700, fontSize: 14 }}>
                              {rawScore}
                            </td>
                            <td rowSpan={rows.length} style={{ ...tdStyle, verticalAlign: 'middle', fontWeight: 700, fontSize: 14, color: '#1a5276' }}>
                              {achievement}
                            </td>
                            <td rowSpan={rows.length} style={{ ...tdStyle, verticalAlign: 'middle', fontWeight: 700, fontSize: 14, color: rankGradeVal != null ? (rankGradeVal <= 3 ? '#c0392b' : '#2c3e50') : '#aab8b5' }}>
                              {rankGradeVal ?? '—'}
                            </td>
                            <td rowSpan={rows.length} style={{ ...tdStyle, verticalAlign: 'middle', fontSize: 13, color: '#555' }}>
                              {rankRow ? `${rankRow.rank}(${rankRow.rank})/${rankRow.total_students}` : '—'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>

            {/* 주석 */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-card)', background: 'var(--bg)' }}>
              <p style={{ fontSize: 11, color: '#888', margin: 0, lineHeight: 1.8 }}>
                ※ 학교에서 성적을 처리한 후 반영된 자료에 한하여 조회 가능합니다.<br />
                ※ 각종 증빙자료 용도로 활용될 효력이 없는 단순 열람용 자료입니다.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}