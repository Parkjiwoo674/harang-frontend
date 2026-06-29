'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowRight, ArrowLeft, Check, User, Lock, School, Hash, GraduationCap, BookOpen } from 'lucide-react'
import { APP_NAME, SCHOOL_NAME } from '@/lib/config'
import { getErrorMessage, formatErrorDetails } from '@/lib/errorHandler'

const steps = ['역할 선택', '기본 정보', '소속 정보', '계정 설정']

// 비밀번호 강도 평가 — 길이 + 문자 종류 다양성 + 흔한 패턴 페널티
function evaluatePassword(pw: string): { level: 0 | 1 | 2; filled: number } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++

  // 숫자만 또는 영문만 → 최대 1점으로 제한
  if (/^(\d+|[a-zA-Z]+)$/.test(pw)) score = Math.min(score, 1)
  // 흔한 시작 패턴 → 0점
  if (/^(1234|abcd|qwer|asdf|0000|1111|password)/i.test(pw)) score = 0

  const level: 0 | 1 | 2 = score >= 4 ? 2 : score >= 2 ? 1 : 0
  const filled = level === 0 ? 1 : level === 1 ? 3 : 4
  return { level, filled }
}

const STRENGTH_COLORS = ['#ef4444', '#eab308', '#22c55e']
const STRENGTH_LABELS = ['약함', '보통', '강함']

export default function SignupPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // 이메일 인증
  const [emailToken, setEmailToken] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailVerifying, setEmailVerifying] = useState(false)
  const [form, setForm] = useState({
    role: 'student' as 'student' | 'teacher',
    name: '', phone: '', email: '',
    grade: '1', class: '1', number: '1',
    subject: '',
    teacherCode: '',
    isHomeroom: false,
    homeroomGrade: '1',
    homeroomClass: '1',
    id: '', password: '', passwordConfirm: '',
    agree: false,
  })

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const canNext = (() => {
    if (step === 0) return !!form.role
    if (step === 1) return form.name.trim().length > 0 && form.email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && emailVerified
    if (step === 2) {
      if (form.role === 'student') return !!(form.grade && form.class && form.number)
      return form.subject.trim().length > 0 && form.teacherCode.trim().length > 0
    }
    return false
  })()

  const handleSubmit = async () => {
    if (!form.id || !form.password || !form.name || !form.email) { setError('필수 항목을 입력해주세요'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('올바른 이메일 형식을 입력해주세요'); return }
    if (form.password !== form.passwordConfirm) { setError('비밀번호가 일치하지 않습니다'); return }
    if (form.password.length < 4) { setError('비밀번호는 4자 이상이어야 합니다'); return }
    if (!form.agree) { setError('이용약관에 동의해주세요'); return }

    setLoading(true); setError('')
    try {
      const { authApi } = await import('@/lib/api')
      await authApi.signup({
        username: form.id,
        password: form.password,
        name: form.name,
        role: form.role,
        grade: form.role === 'student' ? Number(form.grade) : undefined,
        class_num: form.role === 'student' ? Number(form.class) : undefined,
        number: form.role === 'student' ? Number(form.number) : undefined,
        subject: form.role === 'teacher' ? form.subject : undefined,
        teacher_code: form.role === 'teacher' ? form.teacherCode : undefined,       // ← 추가
        homeroom_grade: form.role === 'teacher' && form.isHomeroom ? Number(form.homeroomGrade) : undefined,
        homeroom_class_num: form.role === 'teacher' && form.isHomeroom ? Number(form.homeroomClass) : undefined,
        email: form.email,
        phone: form.phone || undefined,
      })
      await login(form.id, form.password)
      router.push('/dashboard')
    } catch (e: any) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page" style={{
      width: '100vw', minHeight: '100vh', display: 'flex', alignItems: 'stretch',
      fontFamily: 'Pretendard, sans-serif', background: '#f0f4f3'
    }}>
      {/* Left Panel */}
      <div style={{
        width: '38%', minWidth: 340, maxWidth: 520,
        background: 'linear-gradient(160deg, #1e6b60 0%, #0f4840 100%)',
        display: 'flex', flexDirection: 'column', padding: '60px 52px', position: 'relative', overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: 100, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
            <div style={{ width: 42, height: 42, background: 'white', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden' }}>
              <Image 
                src="/icons/logo.png" 
                alt="하랑 로고" 
                width={55} 
                height={55}
                style={{ objectFit: 'cover', minWidth: '100%', minHeight: '100%' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{APP_NAME}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{SCHOOL_NAME}</div>
            </div>
          </div>

          <h1 style={{ fontSize: 34, fontWeight: 900, color: 'white', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 16 }}>
            함께 만드는<br />소통 공간
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 48 }}>
            {APP_NAME}에 합류하여 학교 생활을 더 스마트하게 관리하세요.
          </p>

          {/* Steps indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: i < step ? '#22c55e' : i === step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {i < step
                      ? <Check size={14} color="white" />
                      : <span style={{ fontSize: 12, fontWeight: 700, color: i === step ? '#1a7a6e' : 'rgba(255,255,255,0.5)' }}>{i + 1}</span>
                    }
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 2, height: 32, background: i < step ? '#22c55e' : 'rgba(255,255,255,0.15)', margin: '3px 0' }} />
                  )}
                </div>
                <div style={{ paddingTop: 6, paddingBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: i <= step ? 'white' : 'rgba(255,255,255,0.4)' }}>{s}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {['학생 또는 선생님', '이름, 이메일', '학년/반/번호 또는 담당 과목', '아이디, 비밀번호'][i]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>이미 계정이 있으신가요? </span>
          <Link href="/login" style={{ fontSize: 13, color: 'white', fontWeight: 700, textDecoration: 'none' }}>
            로그인
          </Link>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 60px', overflowY: 'auto' }}>
        <div style={{ width: 520 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {steps.map((s, i) => (
                <div key={s} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i <= step ? '#1a7a6e' : '#e2e8e6',
                  transition: 'background 0.3s'
                }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#6b8a85', marginBottom: 6 }}>
              단계 {step + 1} / {steps.length}
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1a2e2b', letterSpacing: -0.5 }}>
              {steps[step]}
            </h2>
          </div>

          {/* Step 0: Role */}
          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { val: 'student', icon: GraduationCap, title: '학생', desc: '공지 확인, 과제 제출, 채팅 참여' },
                { val: 'teacher', icon: BookOpen, title: '선생님', desc: '공지 작성, 과제 등록, 학생 관리' },
              ].map(r => {
                const selected = form.role === r.val
                return (
                  <button key={r.val} onClick={() => update('role', r.val)} style={{
                    padding: '24px 20px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${selected ? '#1a7a6e' : '#e2e8e6'}`,
                    background: selected ? '#f0f9f7' : 'white',
                    fontFamily: 'inherit',
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: selected ? '#1a7a6e' : '#e8f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <r.icon size={22} color={selected ? 'white' : '#1a7a6e'} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: selected ? '#1a7a6e' : '#1a2e2b', marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: '#6b8a85', lineHeight: 1.5 }}>{r.desc}</div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 1: Basic */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>이름 *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#aab8b5' }} />
                  <input className="input" style={{ paddingLeft: 38 }} placeholder="실명 입력" value={form.name} onChange={e => update('name', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>이메일 *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    type="email"
                    placeholder="example@school.kr"
                    value={form.email}
                    onChange={e => { update('email', e.target.value); setEmailVerified(false); setEmailToken(''); setEmailCode('') }}
                    disabled={emailVerified}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flexShrink: 0, padding: '0 14px', fontSize: 12 }}
                    disabled={emailSending || emailVerified || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)}
                    onClick={async () => {
                      setEmailSending(true)
                      try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/send-verify-email`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: form.email }),
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error)
                        setEmailToken(data.token)
                      } catch (e: any) {
                        alert(e.message)
                      } finally {
                        setEmailSending(false)
                      }
                    }}
                  >
                    {emailVerified ? '✓ 인증완료' : emailSending ? '전송중...' : '인증코드 받기'}
                  </button>
                </div>
                {emailToken && !emailVerified && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      className="input"
                      placeholder="인증코드 6자리"
                      maxLength={6}
                      value={emailCode}
                      onChange={e => setEmailCode(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{ flex: 1, letterSpacing: 4, textAlign: 'center', fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flexShrink: 0, padding: '0 14px', fontSize: 12 }}
                      disabled={emailVerifying || emailCode.length !== 6}
                      onClick={async () => {
                        setEmailVerifying(true)
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/verify-email`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ token: emailToken, code: emailCode }),
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error)
                          setEmailVerified(true)
                        } catch (e: any) {
                          alert(e.message)
                        } finally {
                          setEmailVerifying(false)
                        }
                      }}
                    >
                      {emailVerifying ? '확인중...' : '확인'}
                    </button>
                  </div>
                )}
                {emailVerified && (
                  <p style={{ fontSize: 12, color: '#22c55e', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>✓ 이메일 인증 완료</p>
                )}
                  <p style={{ fontSize: 11, color: '#6b8a85', marginTop: 4 }}>계정 복구 및 알림 수신용</p>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>연락처 (선택)</label>
                <input className="input" placeholder="010-0000-0000" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2: School / Subject */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>학교</label>
                <div style={{ position: 'relative' }}>
                  <School size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#aab8b5' }} />
                  <input className="input" style={{ paddingLeft: 38, background: '#f8fbfa' }} value={SCHOOL_NAME} readOnly />
                </div>
              </div>

              {form.role === 'student' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { label: '학년 *', key: 'grade', opts: ['1', '2', '3'] },
                      { label: '반 *', key: 'class', opts: Array.from({ length: 12 }, (_, i) => String(i + 1)) },
                      { label: '번호 *', key: 'number', opts: Array.from({ length: 40 }, (_, i) => String(i + 1)) },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>{f.label}</label>
                        <select
                          className="input"
                          value={form[f.key as keyof typeof form] as string}
                          onChange={e => update(f.key, e.target.value)}
                          style={{ cursor: 'pointer' }}
                        >
                          {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    background: '#e8f5f3', borderRadius: 10, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}>
                    <Hash size={16} color="#1a7a6e" />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a7a6e' }}>학번 확인</div>
                      <div style={{ fontSize: 13, color: '#1a2e2b', marginTop: 2, fontWeight: 700 }}>
                        {form.grade}학년 {form.class}반 {form.number}번
                      </div>
                    </div>
                  </div>
                </>
              ) : (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>
        담당 과목 *
      </label>
      <input
        className="input"
        placeholder="예: 수학, 영어, 프로그래밍"
        value={form.subject}
        onChange={e => update('subject', e.target.value)}
      />
    </div>

    {/* 담임 여부 */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56' }}>담임 여부</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { val: false, label: '담임 아님', desc: '교과 선생님' },
          { val: true,  label: '담임',     desc: '학급 담임 선생님' },
        ].map(opt => {
          const sel = form.isHomeroom === opt.val
          return (
            <button
              key={String(opt.val)}
              onClick={() => update('isHomeroom', opt.val)}
              style={{
                padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                border: `2px solid ${sel ? '#1a7a6e' : '#e2e8e6'}`,
                background: sel ? '#f0f9f7' : 'white', fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: sel ? '#1a7a6e' : '#1a2e2b' }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: '#6b8a85', marginTop: 3 }}>{opt.desc}</div>
            </button>
          )
        })}
      </div>
    </div>

    {/* 담임이면 학년/반 선택 */}
    {form.isHomeroom && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px', background: '#e8f5f3', borderRadius: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>담임 학년 *</label>
          <select
            className="input"
            value={form.homeroomGrade}
            onChange={e => update('homeroomGrade', e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            {['1', '2', '3'].map(g => <option key={g} value={g}>{g}학년</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>담임 반 *</label>
          <select
            className="input"
            value={form.homeroomClass}
            onChange={e => update('homeroomClass', e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(c => (
              <option key={c} value={c}>{c}반</option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#1a7a6e', fontWeight: 600 }}>
          → {form.homeroomGrade}학년 {form.homeroomClass}반 담임
        </div>
      </div>
    )}

    {/* 교사 인증 코드 */}
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>
        교사 인증 코드 *
      </label>
      <input
        className="input"
        placeholder="학교에서 발급받은 인증 코드"
        value={form.teacherCode}
        onChange={e => update('teacherCode', e.target.value)}
      />
      <p style={{ fontSize: 11, color: '#aab8b5', marginTop: 5 }}>
        인증 코드는 학교 행정실에서 발급받을 수 있습니다
      </p>
    </div>
  </div>
)}
          </div>
          )}
          {/* Step 3: Account */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>아이디 *</label>
                <input className="input" placeholder="2~50자" value={form.id} onChange={e => update('id', e.target.value)} autoComplete="username" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>비밀번호 *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#aab8b5' }} />
                  <input className="input" style={{ paddingLeft: 38 }} type="password" placeholder="4자 이상" value={form.password} onChange={e => update('password', e.target.value)} autoComplete="new-password" />
                </div>
                {form.password && (() => {
                  const { level, filled } = evaluatePassword(form.password)
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: i < filled ? STRENGTH_COLORS[level] : '#e2e8e6'
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: STRENGTH_COLORS[level] }}>
                        {STRENGTH_LABELS[level]}
                      </span>
                    </div>
                  )
                })()}
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>비밀번호 확인 *</label>
                <input className="input" type="password" placeholder="비밀번호 재입력" value={form.passwordConfirm} onChange={e => update('passwordConfirm', e.target.value)} autoComplete="new-password" />
                {form.passwordConfirm && (
                  <div style={{ marginTop: 6, fontSize: 12, color: form.password === form.passwordConfirm ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {form.password === form.passwordConfirm ? <><Check size={12} /> 비밀번호 일치</> : '비밀번호가 일치하지 않습니다'}
                  </div>
                )}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                <input type="checkbox" checked={form.agree} onChange={e => update('agree', e.target.checked)} style={{ accentColor: '#1a7a6e', marginTop: 2 }} />
                <span style={{ fontSize: 12, color: '#6b8a85', lineHeight: 1.6 }}>
                  <span style={{ color: '#1a7a6e', fontWeight: 600 }}>이용약관</span> 및 <span style={{ color: '#1a7a6e', fontWeight: 600 }}>개인정보처리방침</span>에 동의합니다. (필수)
                </span>
              </label>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 32 }}>
            {step > 0 && (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} style={{ padding: '12px 20px' }}>
                <ArrowLeft size={15} /> 이전
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext}
                style={{ flex: 1, justifyContent: 'center', padding: '12px 0', fontSize: 14, opacity: canNext ? 1 : 0.45 }}
              >
                다음 단계 <ArrowRight size={15} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ flex: 1, justifyContent: 'center', padding: '12px 0', fontSize: 14 }}
              >
                {loading ? '처리 중...' : <><Check size={15} /> 가입 완료</>}
              </button>
            )}
          </div>
          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}