'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, Key, Users, Plus, Trash2, RefreshCw, Copy, Check, UserX, UserCheck } from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('harang_token')
}

async function adminApi(path: string, options: RequestInit = {}) {
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
  if (res.status === 204) return null
  return res.json()
}

interface TeacherCode {
  id: number
  code: string
  is_used: boolean
  used_by: { id: number; name: string; username: string } | null
  created_at: string
}

interface AdminUser {
  id: number
  username: string
  name: string
  role: string
  grade?: number
  class_num?: number
  number?: number
  subject?: string
  is_active: boolean
  created_at: string
  email: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'codes' | 'users'>('codes')

  // 교사 코드
  const [codes, setCodes] = useState<TeacherCode[]>([])
  const [codesLoading, setCodesLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genCount, setGenCount] = useState<number | ''>('')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // 유저
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userFilter, setUserFilter] = useState<'all' | 'student' | 'teacher'>('all')

  // admin 아니면 대시보드로
  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard')
  }, [user, router])

  useEffect(() => {
    loadCodes()
    loadUsers()
  }, [])

  const loadCodes = async () => {
    setCodesLoading(true)
    try {
      const data = await adminApi('/api/admin/teacher-codes')
      setCodes(data)
    } finally {
      setCodesLoading(false)
    }
  }

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const data = await adminApi('/api/admin/users')
      setUsers(data)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const newCodes = await adminApi('/api/admin/teacher-codes', {
        method: 'POST',
        body: JSON.stringify({ count: Number(genCount) || 1 }),
      })
      setCodes(prev => [...newCodes, ...prev])
    } catch (e: any) {
      alert(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteCode = async (id: number) => {
    if (!confirm('이 코드를 삭제하시겠습니까?')) return
    try {
      await adminApi(`/api/admin/teacher-codes/${id}`, { method: 'DELETE' })
      setCodes(prev => prev.filter(c => c.id !== id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleCopy = (id: number, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleToggleActive = async (userId: number) => {
    try {
      const res = await adminApi(`/api/admin/users/${userId}/deactivate`, { method: 'PATCH' })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: res.is_active } : u))
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!confirm(`"${name}" 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return
    try {
      await adminApi(`/api/admin/users/${userId}`, { method: 'DELETE' })
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (e: any) {
      alert(e.message)
    }
  }

  const unusedCodes = codes.filter(c => !c.is_used)
  const usedCodes = codes.filter(c => c.is_used)
  const filteredUsers = users.filter(u => userFilter === 'all' || u.role === userFilter)

  if (!user || user.role !== 'admin') return null

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={24} color="#6366f1" /> 관리자 페이지
            </h1>
            <p>교사 인증 코드 관리 및 유저 관리</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadCodes} className="btn btn-secondary" style={{ gap: 6 }}>
              <RefreshCw size={14} /> 새로고침
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 10, marginBottom: 20, width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'codes', label: '교사 인증 코드', icon: <Key size={14} /> },
            { key: 'users', label: '유저 관리', icon: <Users size={14} /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: tab === t.key ? '#6366f1' : 'transparent',
              color: tab === t.key ? 'white' : '#6b8a85',
              fontWeight: 600, fontSize: 13, fontFamily: 'Pretendard, sans-serif',
            }}>{t.icon}{t.label}</button>
          ))}
        </div>

        {/* ── 교사 코드 탭 ── */}
        {tab === 'codes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
            <div>
              {/* 미사용 코드 */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <span className="card-title">🔑 미사용 코드 ({unusedCodes.length}개)</span>
                </div>
                {codesLoading ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>불러오는 중...</div>
                ) : unusedCodes.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>미사용 코드가 없습니다. 새로 생성해주세요.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {unusedCodes.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border-card)' }}>
                        <code style={{ flex: 1, fontSize: 16, fontWeight: 800, letterSpacing: 3, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{c.code}</code>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                        <button onClick={() => handleCopy(c.id, c.code)} style={{ width: 30, height: 30, border: '1px solid #e2e8e6', borderRadius: 6, background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copiedId === c.id ? '#22c55e' : '#6b8a85' }}>
                          {copiedId === c.id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <button onClick={() => handleDeleteCode(c.id)} style={{ width: 30, height: 30, border: '1px solid #fecaca', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 사용된 코드 */}
              {usedCodes.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title" style={{ color: 'var(--text-muted)' }}>✓ 사용된 코드 ({usedCodes.length}개)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {usedCodes.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f8fbfa', borderRadius: 8, opacity: 0.7 }}>
                        <code style={{ flex: 1, fontSize: 14, letterSpacing: 2, color: 'var(--text-muted)', fontFamily: 'monospace', textDecoration: 'line-through' }}>{c.code}</code>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.used_by?.name} ({c.used_by?.username})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 코드 생성 패널 */}
            <div className="card" style={{ alignSelf: 'start' }}>
              <div className="card-header"><span className="card-title">새 코드 생성</span></div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 7 }}>생성 개수</label>
                <input
                  type="text"
                  value={genCount}
                  onChange={e => setGenCount(Number(e.target.value.replace(/[^0-9]/g, '')))}
                  className="input"
                  placeholder="숫자 입력"
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>최대 50개까지 한 번에 생성 가능</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={generating}
                style={{ width: '100%', justifyContent: 'center', padding: '11px 0' }}
              >
                <Plus size={15} /> {generating ? '생성 중...' : `코드 ${genCount || 0}개 생성`}
              </button>

              <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg)', borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text-primary)' }}>코드 발급 방법</strong><br />
                1. 코드 생성 후 복사 버튼 클릭<br />
                2. 교사에게 코드 전달<br />
                3. 교사가 회원가입 시 입력<br />
                4. 사용된 코드는 자동으로 비활성화됩니다
              </div>
            </div>
          </div>
        )}

        {/* ── 유저 관리 탭 ── */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'all', label: `전체 (${users.length})` },
                { key: 'student', label: `학생 (${users.filter(u => u.role === 'student').length})` },
                { key: 'teacher', label: `교사 (${users.filter(u => u.role === 'teacher').length})` },
              ].map(f => (
                <button key={f.key} onClick={() => setUserFilter(f.key as any)} className="btn" style={{
                  padding: '7px 16px', fontSize: 13,
                  background: userFilter === f.key ? '#1a7a6e' : 'white',
                  color: userFilter === f.key ? 'white' : '#6b8a85',
                  border: `1.5px solid ${userFilter === f.key ? '#1a7a6e' : '#e2e8e6'}`,
                }}>{f.label}</button>
              ))}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {usersLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>불러오는 중...</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>아이디</th>
                      <th>역할</th>
                      <th>소속</th>
                      <th>이메일</th>
                      <th>상태</th>
                      <th>가입일</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 700 }}>{u.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.username}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
                            background: u.role === 'teacher' ? '#eff6ff' : u.role === 'admin' ? '#f5f3ff' : '#f0fdf4',
                            color: u.role === 'teacher' ? '#3b82f6' : u.role === 'admin' ? '#8b5cf6' : '#22c55e',
                          }}>
                            {u.role === 'teacher' ? '교사' : u.role === 'admin' ? '관리자' : '학생'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {u.role === 'student' ? `${u.grade}학년 ${u.class_num}반 ${u.number}번` : u.subject || '-'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
                            background: u.is_active ? '#f0fdf4' : '#fef2f2',
                            color: u.is_active ? '#22c55e' : '#ef4444',
                          }}>
                            {u.is_active ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                        <td>
                          {u.role !== 'admin' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => handleToggleActive(u.id)}
                                title={u.is_active ? '비활성화' : '활성화'}
                                style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: u.is_active ? '#fff7ed' : '#f0fdf4', color: u.is_active ? '#f97316' : '#22c55e' }}
                              >
                                {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                title="계정 삭제"
                                style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', color: '#ef4444' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}