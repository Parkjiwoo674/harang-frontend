// ─── 프론트엔드 환경 의존 설정 ─────────────────────────────────
// 학교명, 부제 등 운영 환경에 따라 바뀌는 값은 모두 여기로 모아둡니다.
// .env.local 의 NEXT_PUBLIC_* 값을 통해 빌드 시 주입됩니다.

export const SCHOOL_NAME =
  process.env.NEXT_PUBLIC_SCHOOL_NAME || '학교 이름'

export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME || 'Harang'

export const APP_TAGLINE =
  process.env.NEXT_PUBLIC_APP_TAGLINE || '학교 소통 플랫폼'

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  export function getMediaUrl(path?: string | null): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path}`
}