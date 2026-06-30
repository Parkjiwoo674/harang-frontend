'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Check } from 'lucide-react'
import { APP_NAME, SCHOOL_NAME } from '@/lib/config'
import { authApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/errorHandler'

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0) // 0: 아이디/이메일, 1: 인증코드, 2: 새 비밀번호, 3: 완료
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPwConfirm, setNewPwConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [token, setToken] = useState('')
  const [resetId, setResetId] = useState<number | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 1단계: 아이디 + 이메일로 인증코드 발송
  const handleSendCode = async () => {
    if (!username.trim()) { setError('아이디를 입력해주세요.'); return }
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.forgotPassword(username.trim(), email.trim())
      setToken(res.token)
      setStep(1)
    } catch (e: any) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  // 2단계: 인증코드 확인
  const handleVerifyCode = async () => {
    if (code.length !== 6) { setError('6자리 인증코드를 입력해주세요.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.verifyResetCode(token, code)
      setResetId(res.reset_id)
      setStep(2)
    } catch (e: any) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  // 3단계: 새 비밀번호 설정
  const handleResetPassword = async () => {
    if (newPw.length < 4) { setError('비밀번호는 4자 이상이어야 합니다.'); return }
    if (newPw !== newPwConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (resetId === null) { setError('인증 정보가 만료되었습니다. 처음부터 다시 시도해주세요.'); return }
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword(resetId, token, code, newPw)
      setStep(3)
    } catch (e: any) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page" style={{
      width: '100vw', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      background: '#f0f4f3',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--bg-card, #fff)', borderRadius: 20, padding: '44px 40px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 38, height: 38, background: '#0f4840', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Image src="/icons/logo.png" alt="하랑 로고" width={50} height={50} style={{ objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a2e2b' }}>{APP_NAME}</div>
            <div style={{ fontSize: 11, color: '#6b8a85' }}>{SCHOOL_NAME}</div>
          </div>
        </div>

        {step !== 3 && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1a2e2b', letterSpacing: -0.5, marginBottom: 6 }}>비밀번호 재설정</h2>
            <p style={{ fontSize: 13, color: '#6b8a85', marginBottom: 28 }}>
              {step === 0 && '가입 시 등록한 아이디와 이메일을 입력해주세요.'}
              {step === 1 && '이메일로 발송된 6자리 인증코드를 입력해주세요.'}
              {step === 2 && '새로 사용할 비밀번호를 입력해주세요.'}
            </p>
          </>
        )}

        {/* 0단계: 아이디 / 이메일 */}
        {step === 0 && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3d5a56', display: 'block', marginBottom: 7 }}>아이디</label>
              <input
                className="input"
                type="text"
                placeholder="아이디 입력"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                autoComplete="username"
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3d5a56', display: 'block', marginBottom: 7 }}>이메일</label>
              <input
                className="input"
                type="email"
                placeholder="가입 시 등록한 이메일"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                autoComplete="email"
              />
            </div>

            {error && <ErrorBox message={error} />}

            <button onClick={handleSendCode} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 15, gap: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? '발송 중...' : <>인증코드 받기 <Mail size={16} /></>}
            </button>
          </>
        )}

        {/* 1단계: 인증코드 */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3d5a56', display: 'block', marginBottom: 7 }}>인증코드 (6자리)</label>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                style={{ letterSpacing: 4, textAlign: 'center', fontWeight: 700, fontSize: 18 }}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/[^0-9]/g, '')); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
              />
            </div>

            {error && <ErrorBox message={error} />}

            <button onClick={handleVerifyCode} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 15, gap: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? '확인 중...' : <>인증코드 확인 <ArrowRight size={16} /></>}
            </button>
            <button onClick={() => { setStep(0); setError('') }} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: '#6b8a85', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> 이전으로
            </button>
          </>
        )}

        {/* 2단계: 새 비밀번호 */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3d5a56', display: 'block', marginBottom: 7 }}>새 비밀번호</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="4자 이상"
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setError('') }}
                  style={{ paddingRight: 42 }}
                  autoComplete="new-password"
                />
                <button onClick={() => setShowPw(!showPw)} type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aab8b5', display: 'flex', alignItems: 'center' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#3d5a56', display: 'block', marginBottom: 7 }}>새 비밀번호 확인</label>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="비밀번호 재입력"
                value={newPwConfirm}
                onChange={e => { setNewPwConfirm(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                autoComplete="new-password"
              />
            </div>

            {error && <ErrorBox message={error} />}

            <button onClick={handleResetPassword} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 15, gap: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? '변경 중...' : <>비밀번호 변경 <Check size={16} /></>}
            </button>
          </>
        )}

        {/* 3단계: 완료 */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Check size={28} color="#1a7a6e" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a2e2b', marginBottom: 8 }}>비밀번호가 변경되었습니다</h2>
            <p style={{ fontSize: 13, color: '#6b8a85', marginBottom: 28 }}>새 비밀번호로 다시 로그인해주세요.</p>
            <button onClick={() => router.push('/login')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 15, gap: 8 }}>
              로그인하러 가기 <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step !== 3 && (
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b8a85' }}>
            <Link href="/login" style={{ color: '#1a7a6e', fontWeight: 700, textDecoration: 'none' }}>로그인으로 돌아가기</Link>
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
      {message}
    </div>
  )
}
