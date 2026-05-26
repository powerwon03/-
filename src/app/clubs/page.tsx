'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/types'
import { Search, Plus, Users } from 'lucide-react'

function ClubsContent() {
  const [clubs, setClubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
    setCategory(searchParams.get('category') ?? '전체')
  }, [searchParams])

  useEffect(() => {
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    const { data } = await supabase
      .from('clubs')
      .select('*, president:profiles(name)')
      .eq('is_active', true)
      .order('member_count', { ascending: false })
    setClubs(data ?? [])
    setLoading(false)
  }

  const filtered = clubs.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === '전체' || c.category === category
    return matchSearch && matchCat
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">동아리 찾기</h1>
        <Link
          href="/clubs/create"
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> 동아리 만들기
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="동아리 이름 또는 소개로 검색..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {['전체', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-blue-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat !== '전체' && CATEGORY_EMOJI[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500 mb-4">
          검색결과 <span className="font-semibold text-gray-900">{filtered.length}</span>개의 동아리
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-48">
              <div className="w-12 h-12 bg-gray-100 rounded-xl mb-4" />
              <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((club) => (
            <Link key={club.id} href={`/clubs/${club.id}`}>
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 p-6 h-full group cursor-pointer">
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
                  <span>회장: {club.president?.name ?? '-'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">검색 결과가 없습니다.</p>
          <p className="text-sm mt-1">다른 키워드나 카테고리로 찾아보세요.</p>
        </div>
      )}
    </div>
  )
}

export default function ClubsPage() {
  return (
    <Suspense>
      <ClubsContent />
    </Suspense>
  )
}
