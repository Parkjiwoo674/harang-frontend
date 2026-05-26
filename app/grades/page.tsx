'use client'
import { useAuth } from '@/contexts/AuthContext'
import StudentGradesPage from './student_page'
import TeacherGradesPage from './teacher_page'

export default function GradesPage() {
  const { user } = useAuth()

  if (!user) return null
  if (user.role === 'teacher') return <TeacherGradesPage />
  return <StudentGradesPage />
}