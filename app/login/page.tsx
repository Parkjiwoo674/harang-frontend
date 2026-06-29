'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { APP_NAME, SCHOOL_NAME } from '@/lib/config'
import { Eye, EyeOff, ArrowRight, GraduationCap, BookOpen } from 'lucide-react'
import { getErrorMessage } from '@/lib/errorHandler'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async () => {
    if (!username.trim()) { setError('아이디를 입력해주세요.'); return }
    if (!pw) { setError('비밀번호를 입력해주세요.'); return }
    setSubmitting(true)
    setError('')
    try {
      await login(username.trim(), pw)
      router.push('/dashboard')
    } catch (e: any) {
      setError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page" style={{
      width: '100vw', minHeight: '100vh',
      display: 'flex', alignItems: 'stretch',
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      background: '#f0f4f3',
    }}>
      {/* ── 왼쪽 패널 ── */}
      <div style={{
        width: '40%', minWidth: 360, maxWidth: 560,
        background: 'linear-gradient(160deg, #1e6b60 0%, #0f4840 100%)',
        display: 'flex', flexDirection: 'column',
        padding: '60px 52px',
        position: 'relative', overflow: 'hidden',
        flexShrink: 0,
      }}>
        {[[-80, -80, 320], [60, -60, 240], [-40, 80, 160]].map(([t, r, s], i) => (
          <div key={i} style={{ position: 'absolute', top: t, right: r, width: s, height: s, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 60 }}>
            <div style={{ width: 46, height: 46, background: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden' }}>
              <Image 
                src="/icons/logo.png" 
                alt="하랑 로고" 
                width={60} 
                height={60}
                style={{ objectFit: 'cover', minWidth: '100%', minHeight: '100%' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: -0.5 }}>{APP_NAME}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{SCHOOL_NAME}</div>
            </div>
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 900, color: 'white', lineHeight: 1.2, letterSpacing: -1, marginBottom: 18 }}>
            학교 소통의<br />새로운 방식
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, maxWidth: 340 }}>
            공지부터 과제, 실시간 채팅까지 — {APP_NAME} 하나로 학교 생활에 필요한 모든 소통을 경험하세요.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: <GraduationCap size={18} />, title: '학생', desc: '공지 확인, 과제 관리, 채팅 참여' },
            { icon: <BookOpen size={18} />, title: '선생님', desc: '공지 작성, 채팅방 생성, 학생 관리' },
          ].map(r => (
            <div key={r.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>{r.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{r.title} 계정</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 오른쪽 패널 ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1a2e2b', letterSpacing: -0.5, marginBottom: 6 }}>로그인</h2>
            <p style={{ fontSize: 13, color: '#6b8a85' }}>계정 정보를 입력하세요</p>
          </div>

          {/* 아이디 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3d5a56', display: 'block', marginBottom: 7 }}>아이디</label>
            <input
              className="input"
              type="text"
              placeholder="아이디 입력"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="username"
            />
          </div>

          {/* 비밀번호 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3d5a56', display: 'block', marginBottom: 7 }}>비밀번호</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="비밀번호 입력"
                value={pw}
                onChange={e => { setPw(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ paddingRight: 42 }}
                autoComplete="current-password"
              />
              <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aab8b5', display: 'flex', alignItems: 'center' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* 에러 */}
          {error && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            onClick={handleLogin}
            disabled={submitting || loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 15, gap: 8, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? '로그인 중...' : <> 로그인 <ArrowRight size={16} /></>}
          </button>

          {/* 회원가입 링크 */}
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b8a85' }}>
            계정이 없으신가요?{' '}
            <Link href="/signup" style={{ color: '#1a7a6e', fontWeight: 700, textDecoration: 'none' }}>회원가입</Link>
          </div>
        </div>
      </div>
    </div>
  )
}