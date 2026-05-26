'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { Menu, X, GraduationCap } from 'lucide-react'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      onClick={() => setMenuOpen(false)}
      className={`transition-colors text-sm font-medium ${
        pathname === href ? 'text-yellow-400' : 'text-white/90 hover:text-white'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
              <GraduationCap className="w-6 h-6 text-yellow-400" />
              <span>개신클럽</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLink('/clubs', '동아리 찾기')}
              {user && navLink('/dashboard', '내 동아리')}
            </nav>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && (
              user ? (
                <>
                  <span className="text-white/70 text-sm truncate max-w-[160px]">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-white/90 hover:text-white text-sm transition-colors">
                    로그인
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    회원가입
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-800 px-4 py-4 flex flex-col gap-4 border-t border-blue-700">
          {navLink('/clubs', '동아리 찾기')}
          {user && navLink('/dashboard', '내 동아리')}
          <div className="border-t border-blue-700 pt-4 flex flex-col gap-3">
            {!loading && (
              user ? (
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="text-left text-white/90 text-sm"
                >
                  로그아웃
                </button>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-white/90 text-sm">
                    로그인
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="text-white/90 text-sm">
                    회원가입
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </header>
  )
}
