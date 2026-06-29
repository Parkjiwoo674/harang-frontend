# 아이콘 추가 및 사용 가이드

## 📁 파일 구조

```
harang/
├── public/
│   ├── icons/           # 아이콘 파일들
│   │   ├── logo.png
│   │   ├── logo.svg
│   │   └── ...
│   ├── favicon.ico      # 브라우저 탭 아이콘
│   └── images/          # 기타 이미지
```

## 1️⃣ 아이콘 파일 추가하기

### 방법 1: 파일 탐색기 사용
1. `d:\harang-nextjs\harang\public\` 폴더 열기
2. 아이콘 파일을 드래그해서 추가
   - 예: `logo.png`, `icon-dashboard.svg` 등

### 방법 2: icons 폴더 만들기 (권장)
```
d:\harang-nextjs\harang\public\icons\
```
이 폴더에 모든 아이콘 파일 저장

## 2️⃣ Next.js에서 아이콘 사용하기

### A. Image 컴포넌트 사용 (권장)

```tsx
import Image from 'next/image'

// 일반 사용
<Image 
  src="/icons/logo.png" 
  alt="하랑 로고"
  width={40}
  height={40}
/>

// 스타일과 함께
<Image 
  src="/icons/dashboard.svg" 
  alt="대시보드"
  width={24}
  height={24}
  style={{ filter: 'brightness(0) invert(1)' }} // 흰색으로 변경
/>
```

### B. img 태그 사용 (간단한 경우)

```tsx
<img 
  src="/icons/logo.png" 
  alt="로고"
  style={{ width: 40, height: 40 }}
/>
```

### C. CSS background-image 사용

```tsx
<div style={{
  width: 40,
  height: 40,
  backgroundImage: 'url(/icons/logo.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}} />
```

## 3️⃣ 파비콘 (브라우저 탭 아이콘) 변경

### favicon.ico
`public/favicon.ico` 파일을 추가하면 자동으로 적용됩니다.

### app/layout.tsx에서 설정
```tsx
// app/layout.tsx
export const metadata = {
  title: '하랑 학교',
  description: '학교 소통 플랫폼',
  icons: {
    icon: '/favicon.ico',
    // 또는 여러 사이즈
    icon: [
      { url: '/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png', // iOS 홈 화면 아이콘
  },
}
```

## 4️⃣ Sidebar 로고 변경 예시

```tsx
// components/Sidebar.tsx
import Image from 'next/image'

// 기존 로고 부분을
<div style={{ fontSize: 24, fontWeight: 900, color: '#1a7a6e' }}>
  하랑
</div>

// 이렇게 변경
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  <Image 
    src="/icons/logo.png" 
    alt="하랑 로고"
    width={32}
    height={32}
  />
  <span style={{ fontSize: 24, fontWeight: 900, color: '#1a7a6e' }}>
    하랑
  </span>
</div>
```

## 5️⃣ 로그인 페이지에 로고 추가 예시

```tsx
// app/login/page.tsx
import Image from 'next/image'

<div className="card" style={{ width: 420, padding: '40px 36px' }}>
  {/* 상단에 로고 추가 */}
  <div style={{ textAlign: 'center', marginBottom: 30 }}>
    <Image 
      src="/icons/logo.png" 
      alt="하랑 로고"
      width={80}
      height={80}
      style={{ margin: '0 auto' }}
    />
  </div>
  
  <h2 style={{ textAlign: 'center', marginBottom: 30 }}>로그인</h2>
  {/* ... 나머지 코드 */}
</div>
```

## 6️⃣ SVG 아이콘 색상 변경

### 방법 1: CSS filter
```tsx
<Image 
  src="/icons/icon.svg"
  alt="아이콘"
  width={24}
  height={24}
  style={{ 
    filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(160deg)'
  }}
/>
```

### 방법 2: SVG를 React 컴포넌트로
```tsx
// components/Logo.tsx
export default function Logo({ color = '#1a7a6e', size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill={color} />
      {/* SVG 내용 */}
    </svg>
  )
}
```

## 7️⃣ 추천 아이콘 파일 형식

- **로고**: PNG (투명 배경) 또는 SVG
- **작은 아이콘**: SVG (크기 조절 용이)
- **파비콘**: ICO 또는 PNG (16x16, 32x32, 48x48)
- **이미지**: JPG, PNG, WebP

## 🎨 실전 예제

### 예제 1: 네비게이션에 커스텀 아이콘
```tsx
import Image from 'next/image'

const navItems = [
  { icon: '/icons/home.svg', label: '홈', path: '/' },
  { icon: '/icons/chat.svg', label: '채팅', path: '/chat' },
  { icon: '/icons/grades.svg', label: '성적', path: '/grades' },
]

{navItems.map(item => (
  <Link key={item.path} href={item.path}>
    <Image src={item.icon} alt={item.label} width={20} height={20} />
    <span>{item.label}</span>
  </Link>
))}
```

### 예제 2: 프로필 이미지
```tsx
<div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', overflow: 'hidden' }}>
  <Image 
    src={user.profileImage || '/icons/default-avatar.png'}
    alt={user.name}
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

## 📝 참고사항

1. **경로**: public 폴더의 파일은 `/`로 시작 (예: `/icons/logo.png`)
2. **최적화**: Next.js Image 컴포넌트 사용 시 자동 최적화
3. **크기**: width/height를 명시하면 레이아웃 이동 방지
4. **캐싱**: public 파일은 자동으로 캐싱됨

## 🚀 빠른 시작

1. 아이콘 파일을 `public/icons/` 폴더에 복사
2. 코드에서 `/icons/파일명.확장자` 경로로 사용
3. Next.js Image 컴포넌트로 최적화된 로딩

```tsx
import Image from 'next/image'

<Image 
  src="/icons/your-icon.png" 
  alt="설명"
  width={40}
  height={40}
/>
```
