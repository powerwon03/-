import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '개신클럽 - 충북대학교 동아리 커뮤니티',
  description: '충북대학교 동아리 커뮤니티 플랫폼. 동아리를 찾고, 가입하고, 함께 활동해보세요.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="bg-blue-900 text-blue-200 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm">
            <p className="font-bold text-white text-base mb-1">개신클럽</p>
            <p>충북대학교 동아리 커뮤니티 플랫폼</p>
            <p className="mt-2 text-blue-300">© 2024 개신클럽. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
