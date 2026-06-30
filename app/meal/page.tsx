'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('harang_token')
}

async function fetchMeal(date: string) {
  const res = await fetch(`${BASE}/api/meal?date=${date}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  return res.json()
}

async function fetchWeekMeal(date: string) {
  const res = await fetch(`${BASE}/api/meal/week?date=${date}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  return res.json()
}

// 로컬(한국) 기준 yyyymmdd 문자열로 변환.
// toISOString()은 UTC 기준이라 한국 시간(UTC+9) 자정에는 날짜가 하루 밀리는 버그가 있어 사용하지 않는다.
function toYmd(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function getTodayStr() {
  return toYmd(new Date())
}

function formatDateStr(dateStr: string) {
  const y = dateStr.slice(0, 4)
  const m = dateStr.slice(4, 6)
  const d = dateStr.slice(6, 8)
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return { y, m, d, day: days[date.getDay()], date }
}

function addDays(dateStr: string, n: number) {
  const y = parseInt(dateStr.slice(0, 4))
  const m = parseInt(dateStr.slice(4, 6)) - 1
  const d = parseInt(dateStr.slice(6, 8))
  const date = new Date(y, m, d)
  date.setDate(date.getDate() + n)
  return toYmd(date)
}

function getWeekDays(dateStr: string) {
  const y = parseInt(dateStr.slice(0, 4))
  const m = parseInt(dateStr.slice(4, 6)) - 1
  const d = parseInt(dateStr.slice(6, 8))
  const date = new Date(y, m, d)
  const day = date.getDay()
  const diffMon = day === 0 ? -6 : 1 - day
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(date)
    dd.setDate(date.getDate() + diffMon + i)
    return toYmd(dd)
  })
}

const MEAL_ICONS: Record<string, string> = { '조식': '☀️', '중식': '🌤️', '석식': '🌙' }
const MEAL_COLORS: Record<string, string> = { '조식': '#f59e0b', '중식': '#1a7a6e', '석식': '#8b5cf6' }
const MEAL_BG: Record<string, string> = { '조식': '#fff8e1', '중식': '#e8f5f3', '석식': '#ede7f6' }

function NutriRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ width: 28, fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 7, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ width: 40, fontSize: 13, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{value}g</span>
    </div>
  )
}

function MealCard({ meal, isCurrent }: { meal: any; isCurrent: boolean }) {
  const icon = MEAL_ICONS[meal.type] || '🍽️'
  const dotColor = MEAL_COLORS[meal.type] || '#1a7a6e'
  const iconBg = MEAL_BG[meal.type] || '#e8f5f3'
  const protein = meal.nutrition?.['단백질(g)'] ?? 0
  const fat = meal.nutrition?.['지방(g)'] ?? 0
  const carb = meal.nutrition?.['탄수화물(g)'] ?? 0

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      border: isCurrent ? '2.5px solid #1a7a6e' : '1.5px solid #e8f0ee',
      boxShadow: isCurrent ? '0 6px 24px rgba(26,122,110,.14)' : '0 1px 4px rgba(0,0,0,.06)',
      flex: 1,
    }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: 13, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{icon}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{meal.type}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isCurrent && <span style={{ fontSize: 13, fontWeight: 700, background: '#1a7a6e', color: 'white', borderRadius: 6, padding: '4px 10px' }}>진행 중</span>}
          <span style={{ fontSize: 15, color: 'var(--text-secondary)', background: '#f3f7f6', border: '1px solid #e2e8e6', borderRadius: 22, padding: '5px 16px', fontWeight: 600 }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: 16 }}>{meal.kcal.toFixed(0)}</strong> kcal
          </span>
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div style={{ padding: '18px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
        {meal.items.map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
            {item.allergy && (
              <span style={{ fontSize: 11, color: '#b91c1c', background: '#fef2f2', borderRadius: 5, padding: '2px 7px' }}>{item.allergy}</span>
            )}
          </div>
        ))}
      </div>

      {/* 영양소 */}
      {(protein > 0 || fat > 0 || carb > 0) && (
        <div style={{ padding: '14px 22px 18px', borderTop: '1px solid #f0f4f3' }}>
          <NutriRow label="탄수" value={carb} max={300} color="#eab308" />
          <NutriRow label="단백" value={protein} max={65} color="#1a7a6e" />
          <NutriRow label="지방" value={fat} max={54} color="#8b5cf6" />
        </div>
      )}
    </div>
  )
}

export default function MealPage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(getTodayStr())
  const [meals, setMeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [weekMeals, setWeekMeals] = useState<Record<string, any[]>>({})
  const weekDays = getWeekDays(selectedDate)
  const today = getTodayStr()
  const { y, m, d, day } = formatDateStr(selectedDate)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchMeal(selectedDate),
      fetchWeekMeal(selectedDate),
    ]).then(([dayData, weekData]) => {
      setMeals(dayData.meals || [])
      // 주간 데이터 날짜별로 그룹화
      const grouped: Record<string, any[]> = {}
      for (const meal of (weekData.meals || [])) {
        if (!grouped[meal.date]) grouped[meal.date] = []
        grouped[meal.date].push(meal)
      }
      setWeekMeals(grouped)
    }).finally(() => setLoading(false))
  }, [selectedDate])

  const totalKcal = meals.reduce((s, m) => s + m.kcal, 0)
  const totalProtein = meals.reduce((s, m) => s + (m.nutrition?.['단백질(g)'] ?? 0), 0)
  const totalFat = meals.reduce((s, m) => s + (m.nutrition?.['지방(g)'] ?? 0), 0)
  const totalCarb = meals.reduce((s, m) => s + (m.nutrition?.['탄수화물(g)'] ?? 0), 0)

  // 현재 시간 기준 진행 중인 식사 판단
  const hour = new Date().getHours()
  const currentMealType = hour < 9 ? '조식' : hour < 14 ? '중식' : '석식'

  const allergens = meals.flatMap(m => m.items || [])
    .filter((item: any) => item.allergy)
    .filter((item: any, i: number, arr: any[]) => arr.findIndex(x => x.name === item.name) === i)

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', padding: '28px 32px 24px', gap: 16, background: 'var(--bg)' }}>

        {/* 상단 바 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>🍱 급식판</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              경북소프트웨어마이스터고등학교 · {y}년 {m}월 {d}일 {day}요일
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', borderRadius: 10, padding: '8px 14px', border: '1px solid #e2e8e6' }}>
              <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>‹</button>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', padding: '0 10px', whiteSpace: 'nowrap' }}>{y}년 {m}월 {d}일 {day}</span>
              <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>›</button>
            </div>
            <button onClick={() => setSelectedDate(today)} style={{ padding: '10px 18px', background: '#1a7a6e', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>오늘</button>
          </div>
        </div>

        {/* 요일 스트립 */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {weekDays.map((dateStr) => {
            const { d: dd, day: dayLabel } = formatDateStr(dateStr)
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === today
            const hasMeal = (weekMeals[dateStr] ?? []).length > 0
            return (
              <div key={dateStr} onClick={() => setSelectedDate(dateStr)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 18px', borderRadius: 11, cursor: 'pointer',
                border: `1.5px solid ${isSelected ? '#1a7a6e' : '#e2e8e6'}`,
                background: isSelected ? '#1a7a6e' : 'white',
                minWidth: 64, transition: 'all .15s', flexShrink: 0,
              }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: isSelected ? 'rgba(255,255,255,.7)' : '#aab8b5' }}>{dayLabel}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: isSelected ? 'white' : isToday ? '#1a7a6e' : '#1a2e2b' }}>{dd}</span>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,.5)' : hasMeal ? '#1a7a6e' : 'transparent' }} />
              </div>
            )
          })}
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            급식 정보를 불러오는 중...
          </div>
        ) : meals.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14, flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 40 }}>🍽️</span>
            <p>이날 급식 정보가 없습니다</p>
          </div>
        ) : (
          <>
            {/* 요약 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, flexShrink: 0 }}>
              {[
                { label: '🔥 하루 총 칼로리', val: totalKcal.toFixed(0), unit: 'kcal', bg: 'linear-gradient(135deg, #f97316, #ea580c)' },
                { label: '🌾 탄수화물', val: Math.round(totalCarb), unit: 'g', bg: 'linear-gradient(135deg, #eab308, #ca8a04)' },
                { label: '🥩 단백질', val: Math.round(totalProtein), unit: 'g', bg: 'linear-gradient(135deg, #1a7a6e, #0f4840)' },
                { label: '💧 지방', val: Math.round(totalFat), unit: 'g', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
              ].map((c, i) => (
                <div key={i} style={{ background: c.bg, borderRadius: 16, padding: '18px 22px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, opacity: .8, marginBottom: 8 }}>{c.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>{c.val}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, opacity: .9 }}>{c.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 식사 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${meals.length}, minmax(0, 1fr))`, gap: 16, flex: 1, minHeight: 0 }}>
              {meals.map((meal, i) => (
                <MealCard key={i} meal={meal} isCurrent={selectedDate === today && meal.type === currentMealType} />
              ))}
            </div>

            {/* 알레르기 정보 */}
            {allergens.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '14px 20px', border: '1px solid var(--border-card)', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>⚠️ 알레르기 정보</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allergens.map((item: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px' }}>
                      <strong>{item.name}</strong> · {item.allergy}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}