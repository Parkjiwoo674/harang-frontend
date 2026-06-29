'use client'
import { useAuth } from '@/contexts/AuthContext'
import StudentGradesPage from './student_page'
import TeacherGradesPage from './teacher_page'
import SubjectTeacherGradesPage from './subject_teacher_page'

export default function GradesPage() {
  const { user } = useAuth()

  if (!user) return null
  
  if (user.role === 'teacher') {
    // 담임교사면 담임반 전체 성적 관리
    if (user.homeroomGrade && user.homeroomClass) {
      return <TeacherGradesPage />
    }
    // 과목 담당교사면 자기 과목만 성적 입력
    return <SubjectTeacherGradesPage />
  }
  
  return <StudentGradesPage />
}