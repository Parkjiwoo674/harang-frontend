'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, UserOut } from '@/lib/api'
import { getErrorMessage } from '@/lib/errorHandler'

export type UserRole = 'student' | 'teacher' | 'admin'

export interface User {
  id: string
  name: string
  role: UserRole
  grade?: number
  class?: number
  number?: number
  subject?: string
  avatarText: string
  avatarColor: string
  profileImage?: string | null
  _apiId: number
  homeroomGrade?: number
  homeroomClass?: number
}

function mapUser(u: UserOut): User {
  return {
    id: u.username,
    name: u.name,
    role: u.role,
    grade: u.grade,
    class: u.class_num,
    number: u.number,
    subject: u.subject,
    avatarText: u.avatar_text,
    avatarColor: u.avatar_color,
    profileImage: u.profile_image || null,
    _apiId: u.id,
    homeroomGrade: u.homeroom_grade,
    homeroomClass: u.homeroom_class_num,
  }
}

interface AuthCtx {
  user: User | null
  loading: boolean
  error: string
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setUser: (u: any) => void
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: false, error: '',
  login: async () => {}, logout: () => {}, setUser: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('harang_token')
    if (!token) { setLoading(false); return }
    authApi.me()
      .then(u => setUserState(mapUser(u)))
      .catch(() => localStorage.removeItem('harang_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    setError('')
    setLoading(true)
    try {
      const { access_token } = await authApi.login(username, password)
      localStorage.setItem('harang_token', access_token)
      const me = await authApi.me()
      setUserState(mapUser(me))
    } catch (e: any) {
      setError(getErrorMessage(e))
      throw e
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('harang_token')
    setUserState(null)
  }

  const setUser = (u: any) => {
    if (u && u.username !== undefined) setUserState(mapUser(u))
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }