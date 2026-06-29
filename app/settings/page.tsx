'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { usersApi, authApi } from '@/lib/api'
import { User, Bell, Palette, Shield, Camera, Check, LogOut, Eye, EyeOff } from 'lucide-react'

const SETTINGS_KEY = 'harang_settings'
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const AVATAR_COLORS = ['#1a7a6e','#3b82f6','#8b5cf6','#ef4444','#f97316','#eab308','#22c55e','#ec4899','#14b8a6','#6366f1']

const DEFAULT_NOTIFS = { notice: true, assignment: true, chat: true, email: false, push: true, sound: false }
const DEFAULT_APPEARANCE = { theme: 'light', compact: false }
const DEFAULT_PRIVACY = { profileVisibility: '전체', onlineStatus: '항상 표시' }

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#1a7a6e' : '#e2e8e6', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout, setUser } = useAuth()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [active, setActive] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // 프로필
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [avatarColor, setAvatarColor] = useState('#1a7a6e')
  const [avatarText, setAvatarText] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // 비밀번호
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPwConfirm, setNewPwConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  // 기타 설정
  const [notifs, setNotifs] = useState(DEFAULT_NOTIFS)
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE)
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY)

  const handleLogout = () => { logout(); router.push('/login') }

  useEffect(() => {
    authApi.me().then((me: any) => {
      setName(me.name || '')
      setPhone(me.phone || '')
      setEmail(me.email || '')
      setBio(me.bio || '')
      setAvatarColor(me.avatar_color || '#1a7a6e')
      setAvatarText(me.avatar_text || me.name?.[0] || '?')
      setProfileImage(me.profile_image || null)
    }).catch(() => {})

    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.notifs) setNotifs(parsed.notifs)
        if (parsed.appearance) setAppearance(parsed.appearance)
        if (parsed.privacy) setPrivacy(parsed.privacy)
      }
    } catch {}
  }, [])

  const showSaved = (msg = '저장되었습니다') => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 2500)
  }

  // 프로필 저장
  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const updated = await usersApi.updateMe({ name, phone, email, bio, avatar_text: avatarText, avatar_color: avatarColor })
      if (setUser) setUser(updated)
      showSaved()
    } catch (e: any) {
      alert(e.message || '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  // 프로필 사진 업로드
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const res = await usersApi.uploadAvatar(file)
      if (res.profile_image) {
        setProfileImage(res.profile_image)
        if (setUser) setUser(res.user)
        showSaved('프로필 사진이 변경되었습니다')
      }
    } catch (e: any) {
      alert(e.message || '업로드 실패')
    } finally {
      setAvatarUploading(false)
    }
  }

  // 프로필 사진 삭제
  const handleAvatarDelete = async () => {
    if (!confirm('프로필 사진을 삭제할까요?')) return
    try {
      const updated = await usersApi.deleteAvatar()
      setProfileImage(null)
      if (setUser) setUser(updated)
      showSaved('프로필 사진이 삭제되었습니다')
    } catch (e: any) {
      alert(e.message || '삭제 실패')
    }
  }

  // 비밀번호 변경
  const handleChangePassword = async () => {
    setPwError('')
    setPwMsg('')
    if (!currentPw || !newPw || !newPwConfirm) { setPwError('모든 항목을 입력해주세요'); return }
    if (newPw !== newPwConfirm) { setPwError('새 비밀번호가 일치하지 않습니다'); return }
    if (newPw.length < 4) { setPwError('비밀번호는 4자 이상이어야 합니다'); return }
    setSaving(true)
    try {
      await usersApi.changePassword({ current_password: currentPw, new_password: newPw })
      setPwMsg('비밀번호가 변경되었습니다')
      setCurrentPw(''); setNewPw(''); setNewPwConfirm('')
    } catch (e: any) {
      setPwError(e.message || '변경 실패')
    } finally {
      setSaving(false)
    }
  }

  // 기타 설정 저장 + 실제 적용
  const handleSaveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ notifs, appearance, privacy }))
    // 다크모드 적용
    document.body.classList.toggle('dark', appearance.theme === 'dark')
    document.documentElement.classList.toggle('dark-init', appearance.theme === 'dark')
    // 컴팩트 모드 적용
    document.body.classList.toggle('compact', appearance.compact)
    document.documentElement.classList.toggle('compact-init', appearance.compact)
    showSaved()
  }

  const sections = [
    { id: 'profile', label: '프로필', icon: User },
    { id: 'password', label: '비밀번호', icon: Shield },
    { id: 'notifications', label: '알림', icon: Bell },
    { id: 'appearance', label: '화면 설정', icon: Palette },
  ]

  const avatarSrc = profileImage ? `${BASE}${profileImage}` : null

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={24} color="#1a7a6e" /> 설정
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
          {/* 사이드 메뉴 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sections.map(s => {
              const Icon = s.icon
              return (
                <button key={s.id} onClick={() => setActive(s.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: active === s.id ? 700 : 400,
                  background: active === s.id ? '#e8f5f3' : 'transparent',
                  color: active === s.id ? '#1a7a6e' : '#6b8a85',
                }}>
                  <Icon size={16} />
                  {s.label}
                </button>
              )
            })}
            <div style={{ borderTop: '1px solid var(--border-card)', marginTop: 8, paddingTop: 8 }}>
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', fontSize: 14, color: '#ef4444', background: 'transparent', width: '100%',
              }}>
                <LogOut size={16} /> 로그아웃
              </button>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="card" style={{ padding: '24px 28px' }}>
            {savedMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
                <Check size={15} /> {savedMsg}
              </div>
            )}

            {/* ── 프로필 탭 ── */}
            {active === 'profile' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>프로필 설정</h2>

                {/* 프로필 사진 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border-card)' }}>
                  <div style={{ position: 'relative' }}>
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="프로필" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e8f0ee' }} />
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: 'white', border: '3px solid #e8f0ee' }}>
                        {avatarText || '?'}
                      </div>
                    )}
                    <button onClick={() => fileRef.current?.click()} disabled={avatarUploading} style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#1a7a6e', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Camera size={12} color="white" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                      {user?.role === 'teacher' ? '교사' : user?.role === 'admin' ? '관리자' : `${user?.grade}학년 ${user?.class}반 ${user?.number}번`}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => fileRef.current?.click()} style={{ padding: '5px 12px', fontSize: 12, background: '#1a7a6e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {avatarUploading ? '업로드 중...' : '사진 변경'}
                      </button>
                      {avatarSrc && (
                        <button onClick={handleAvatarDelete} style={{ padding: '5px 12px', fontSize: 12, background: 'var(--bg-card)', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                          사진 삭제
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 아바타 색상 (사진 없을 때) */}
                {!avatarSrc && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>아바타 색상</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {AVATAR_COLORS.map(c => (
                        <button key={c} onClick={() => setAvatarColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: avatarColor === c ? '3px solid #1a2e2b' : '2px solid transparent', cursor: 'pointer', outline: 'none' }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 폼 필드 */}
                {[
                  { label: '이름', value: name, onChange: setName, placeholder: '이름' },
                  { label: '이메일', value: email, onChange: setEmail, placeholder: 'example@school.kr' },
                  { label: '전화번호', value: phone, onChange: setPhone, placeholder: '010-0000-0000' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>자기소개</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="자기소개를 입력하세요" rows={3}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>

                <button onClick={handleSaveProfile} disabled={saving} className="btn btn-primary" style={{ padding: '10px 28px', fontSize: 14 }}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}

            {/* ── 비밀번호 탭 ── */}
            {active === 'password' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>비밀번호 변경</h2>
                {[
                  { label: '현재 비밀번호', value: currentPw, onChange: setCurrentPw },
                  { label: '새 비밀번호', value: newPw, onChange: setNewPw },
                  { label: '새 비밀번호 확인', value: newPwConfirm, onChange: setNewPwConfirm },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPw ? 'text' : 'password'} value={f.value} onChange={e => f.onChange(e.target.value)}
                        style={{ width: '100%', padding: '9px 40px 9px 12px', fontSize: 14, border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                      <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
                {pwError && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{pwError}</p>}
                {pwMsg && <p style={{ fontSize: 13, color: '#22c55e', marginBottom: 12 }}>{pwMsg}</p>}
                <button onClick={handleChangePassword} disabled={saving} className="btn btn-primary" style={{ padding: '10px 28px', fontSize: 14 }}>
                  {saving ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            )}

            {/* ── 알림 탭 ── */}
            {active === 'notifications' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>알림 설정</h2>
                {[
                  { key: 'notice', label: '공지사항 알림', desc: '새 공지사항이 등록될 때 알림을 받습니다' },
                  { key: 'assignment', label: '과제 알림', desc: '새 과제 및 마감 임박 시 알림을 받습니다' },
                  { key: 'chat', label: '채팅 알림', desc: '새 메시지가 도착하면 알림을 받습니다' },
                  { key: 'email', label: '이메일 알림', desc: '중요 공지를 이메일로도 받습니다' },
                  { key: 'push', label: '푸시 알림', desc: '브라우저 푸시 알림을 받습니다' },
                  { key: 'sound', label: '알림음', desc: '알림 수신 시 소리를 재생합니다' },
                ].map(n => (
                  <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-card)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{n.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{n.desc}</div>
                    </div>
                    <Toggle on={notifs[n.key as keyof typeof notifs]} onChange={() => setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof notifs] }))} />
                  </div>
                ))}
                <button onClick={handleSaveSettings} className="btn btn-primary" style={{ padding: '10px 28px', fontSize: 14, marginTop: 20 }}>저장</button>
              </div>
            )}

            {/* ── 화면 설정 탭 ── */}
            {active === 'appearance' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>화면 설정</h2>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>테마</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['light', 'dark'].map(t => (
                      <button key={t} onClick={() => setAppearance(prev => ({ ...prev, theme: t }))} style={{
                        padding: '8px 20px', fontSize: 13, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                        background: appearance.theme === t ? '#1a7a6e' : 'white',
                        color: appearance.theme === t ? 'white' : '#6b8a85',
                        border: `1.5px solid ${appearance.theme === t ? '#1a7a6e' : '#e2e8e6'}`,
                      }}>{t === 'light' ? '라이트' : '다크'}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-card)' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>컴팩트 모드</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>UI 요소 간격을 줄여 더 많은 정보를 표시합니다</div>
                  </div>
                  <Toggle on={appearance.compact} onChange={() => setAppearance(prev => ({ ...prev, compact: !prev.compact }))} />
                </div>
                <button onClick={handleSaveSettings} className="btn btn-primary" style={{ padding: '10px 28px', fontSize: 14, marginTop: 20 }}>저장</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}