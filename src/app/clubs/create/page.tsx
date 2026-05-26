'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

export default function CreateClubPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
  })

  const update = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // 프로필 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      setError('프로필 정보가 없습니다. 다시 로그인해주세요.')
      setLoading(false)
      return
    }

    // 동아리 생성
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        president_id: user.id,
        member_count: 1,
      })
      .select()
      .single()

    if (clubError) {
      setError('동아리 생성에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    // 회장으로 멤버 등록
    await supabase.from('club_members').insert({
      club_id: club.id,
      user_id: user.id,
      role: 'president',
    })

    router.push(`/clubs/${club.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/clubs" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> 동아리 목록으로
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">새 동아리 만들기</h1>
        <p className="text-gray-500 text-sm mb-8">동아리를 만들면 자동으로 회장이 됩니다.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              동아리 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="동아리 이름을 입력하세요"
              required
              maxLength={50}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors flex flex-col items-center gap-1 ${
                    form.category === cat
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{CATEGORY_EMOJI[cat]}</span>
                  <span className="text-xs">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">동아리 소개</label>
            <textarea
              value={form.description}
              onChange={update('description')}
              placeholder="동아리를 소개해주세요. 활동 내용, 모집 대상 등을 작성하면 좋아요."
              rows={5}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/clubs"
              className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors text-sm"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading || !form.name || !form.category}
              className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white py-3 rounded-xl font-semibold transition-colors text-sm"
            >
              {loading ? '생성 중...' : '동아리 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
