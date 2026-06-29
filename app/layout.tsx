import type { Metadata } from 'next'
import '../styles/globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { APP_NAME, APP_TAGLINE, SCHOOL_NAME } from '@/lib/config'

export const metadata: Metadata = {
  title: `${APP_NAME} - ${APP_TAGLINE}`,
  description: `${SCHOOL_NAME} ${APP_TAGLINE}`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 새로고침 시 다크모드/컴팩트 모드 깜빡임 방지 */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var s = JSON.parse(localStorage.getItem('harang_settings') || '{}');
              if (s.appearance) {
                if (s.appearance.theme === 'dark') document.documentElement.classList.add('dark-init');
                if (s.appearance.compact) document.documentElement.classList.add('compact-init');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        <AuthProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  )
}