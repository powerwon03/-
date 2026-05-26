export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SearchBar from '@/components/SearchBar'
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/types'
import { Users, BookOpen, Calendar } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: clubs } = await supabase
    .from('clubs')
    .select('*, president:profiles(name)')
    .eq('is_active', true)
    .order('member_count', { ascending: false })
    .limit(6)

  const totalMembers = clubs?.reduce((acc, c) => acc + c.member_count, 0) ?? 0

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-5xl font-bold mb-3">개신클럽</h1>
          <p className="text-blue-200 text-xl mb-10">충북대학교 동아리 커뮤니티 플랫폼</p>
          <SearchBar />
          <div className="flex justify-center gap-2 mt-8 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/clubs?category=${encodeURIComponent(cat)}`}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm transition-colors"
              >
                {CATEGORY_EMOJI[cat]} {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-700" />
              </div>
              <p className="text-3xl font-bold text-blue-900">{clubs?.length ?? 0}</p>
              <p className="text-gray-500 text-sm">등록된 동아리</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-700" />
              </div>
              <p className="text-3xl font-bold text-blue-900">{totalMembers}</p>
              <p className="text-gray-500 text-sm">활동 부원</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-700" />
              </div>
              <p className="text-3xl font-bold text-blue-900">{CATEGORIES.length}</p>
              <p className="text-gray-500 text-sm">동아리 카테고리</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular clubs */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">인기 동아리</h2>
          <Link href="/clubs" className="text-blue-700 hover:text-blue-900 text-sm font-medium">
            전체보기 →
          </Link>
        </div>

        {clubs && clubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <Link key={club.id} href={`/clubs/${club.id}`}>
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 p-6 h-full group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-100 transition-colors">
                      {CATEGORY_EMOJI[club.category] ?? '✨'}
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                      {club.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                    {club.name}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    {club.description ?? '동아리 소개가 없습니다.'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {club.member_count}명
                    </span>
                    <span>회장: {(club.president as any)?.name ?? '-'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🎓</p>
            <p className="text-lg">아직 등록된 동아리가 없습니다.</p>
            <Link href="/clubs/create" className="text-blue-700 hover:underline mt-2 inline-block text-sm">
              첫 번째 동아리를 만들어보세요!
            </Link>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">나만의 동아리를 시작해보세요</h2>
          <p className="text-gray-600 mb-8">
            충북대학교 학생이라면 누구든지 동아리를 만들고 멤버를 모집할 수 있어요.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/clubs"
              className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              동아리 둘러보기
            </Link>
            <Link
              href="/clubs/create"
              className="bg-white hover:bg-gray-50 text-blue-900 border-2 border-blue-900 px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              + 동아리 만들기
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
