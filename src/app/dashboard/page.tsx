'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_EMOJI, ROLE_LABELS, type ClubRole } from '@/lib/types'
import { Plus, Users, Clock, Settings } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [myClubs, setMyClubs] = useState<any[]>([])
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // 프로필
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(prof)

    // 내 동아리 멤버십
    const { data: memberships } = await supabase
      .from('club_members')
      .select('role, joined_at, club:clubs(id, name, description, category, member_count)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
    setMyClubs(memberships ?? [])

    // 내 가입 신청 현황
    const { data: reqs } = await supabase
      .from('join_requests')
      .select('id, status, created_at, club:clubs(id, name, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setMyRequests(reqs ?? [])

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100" />)}
          </div>
        </div>
      </div>
    )
  }

  const pendingRequests = myRequests.filter(r => r.status === 'pending')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {profile?.name?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile?.name}</h1>
            <p className="text-gray-500 text-sm">{profile?.department} · 학번 {profile?.student_id}</p>
            <p className="text-gray-400 text-xs mt-0.5">{profile?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-900 text-white rounded-2xl p-5">
          <p className="text-blue-200 text-sm mb-1">가입한 동아리</p>
          <p className="text-3xl font-bold">{myClubs.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-gray-500 text-sm mb-1">대기 중인 신청</p>
          <p className="text-3xl font-bold text-gray-900">{pendingRequests.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-gray-500 text-sm mb-1">회장인 동아리</p>
          <p className="text-3xl font-bold text-gray-900">
            {myClubs.filter(m => m.role === 'president').length}
          </p>
        </div>
      </div>

      {/* My Clubs */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">내 동아리</h2>
          <Link
            href="/clubs/create"
            className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> 만들기
          </Link>
        </div>

        {myClubs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="mb-3">아직 가입한 동아리가 없어요.</p>
            <Link
              href="/clubs"
              className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-medium text-sm inline-block"
            >
              동아리 찾기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClubs.map((mem) => {
              const club = mem.club
              if (!club) return null
              return (
                <Link key={club.id} href={`/clubs/${club.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all p-5 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-100 transition-colors">
                          {CATEGORY_EMOJI[club.category] ?? '✨'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-900">{club.name}</h3>
                          <p className="text-xs text-gray-400">{club.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          mem.role === 'president' ? 'bg-blue-100 text-blue-700' :
                          mem.role === 'officer' ? 'bg-purple-50 text-purple-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {ROLE_LABELS[mem.role as ClubRole]}
                        </span>
                        {(mem.role === 'president' || mem.role === 'officer') && (
                          <Link
                            href={`/clubs/${club.id}/manage`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-gray-700"
                          >
                            <Settings className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {club.member_count}명
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Join Requests History */}
      {myRequests.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">가입 신청 현황</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {myRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-base">
                      {CATEGORY_EMOJI[req.club?.category] ?? '✨'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{req.club?.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(req.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    req.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                    req.status === 'approved' ? 'bg-green-50 text-green-700' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {req.status === 'pending' ? '검토 중' :
                     req.status === 'approved' ? '승인됨' : '거절됨'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
