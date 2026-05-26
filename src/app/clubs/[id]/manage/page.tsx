'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS, type ClubRole } from '@/lib/types'
import { ArrowLeft, Check, X, UserCog, ShieldCheck } from 'lucide-react'

type ManageTab = 'requests' | 'members' | 'settings'

export default function ManagePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<ManageTab>('requests')
  const [loading, setLoading] = useState(true)
  const [myRole, setMyRole] = useState<ClubRole | null>(null)
  const [club, setClub] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', category: '' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')

  useEffect(() => {
    init()
  }, [id])

  useEffect(() => {
    if (!myRole) return
    if (tab === 'requests') fetchRequests()
    else if (tab === 'members') fetchMembers()
  }, [tab, myRole])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: mem } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', id)
      .eq('user_id', user.id)
      .single()

    const role = mem?.role as ClubRole
    if (!role || (role !== 'president' && role !== 'officer')) {
      router.push(`/clubs/${id}`)
      return
    }
    setMyRole(role)

    const { data: clubData } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single()
    setClub(clubData)
    setSettingsForm({
      name: clubData?.name ?? '',
      description: clubData?.description ?? '',
      category: clubData?.category ?? '',
    })

    setLoading(false)
    fetchRequests()
  }

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('join_requests')
      .select('*')
      .eq('club_id', id)
      .order('created_at', { ascending: false })
    setRequests(data ?? [])
  }

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('club_members')
      .select('*, profile:profiles(name, email, department, student_id, phone)')
      .eq('club_id', id)
      .order('joined_at', { ascending: true })
    setMembers(data ?? [])
  }

  const handleRequest = async (reqId: string, userId: string | null, action: 'approved' | 'rejected') => {
    setProcessing(reqId)

    await supabase
      .from('join_requests')
      .update({ status: action })
      .eq('id', reqId)

    if (action === 'approved' && userId) {
      await supabase.from('club_members').insert({
        club_id: id,
        user_id: userId,
        role: 'member',
      })
    }

    await fetchRequests()
    setProcessing(null)
  }

  const handleRoleChange = async (memberId: string, userId: string, newRole: ClubRole) => {
    setProcessing(memberId)
    await supabase
      .from('club_members')
      .update({ role: newRole })
      .eq('id', memberId)
    await fetchMembers()
    setProcessing(null)
  }

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (!confirm('정말 이 멤버를 내보내겠습니까?')) return
    setProcessing(memberId)
    await supabase.from('club_members').delete().eq('id', memberId)
    await fetchMembers()
    setProcessing(null)
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    const { error } = await supabase
      .from('clubs')
      .update({
        name: settingsForm.name,
        description: settingsForm.description,
        category: settingsForm.category,
      })
      .eq('id', id)
    setSettingsMsg(error ? '저장에 실패했습니다.' : '저장되었습니다.')
    setSavingSettings(false)
    setTimeout(() => setSettingsMsg(''), 3000)
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-gray-400 text-center">불러오는 중...</div>

  const TABS: { key: ManageTab; label: string }[] = [
    { key: 'requests', label: `가입 신청${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key: 'members', label: '멤버 관리' },
    { key: 'settings', label: '동아리 설정' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/clubs/${id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> {club?.name}으로 돌아가기
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-6 h-6 text-blue-700" />
        <h1 className="text-2xl font-bold text-gray-900">동아리 관리</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Join Requests */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
              <p>가입 신청이 없습니다.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{req.name}</span>
                      {req.is_president_claim && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          회장 신청
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                        req.status === 'approved' ? 'bg-green-50 text-green-700' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {req.status === 'pending' ? '대기 중' : req.status === 'approved' ? '승인됨' : '거절됨'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-0.5">
                      <p>{req.department} · 학번: {req.student_id}</p>
                      <p>연락처: {req.phone}</p>
                      {req.message && (
                        <p className="text-gray-600 bg-gray-50 rounded-lg p-2 mt-2 text-xs">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleRequest(req.id, req.user_id, 'rejected')}
                        disabled={processing === req.id}
                        className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                      >
                        <X className="w-4 h-4" /> 거절
                      </button>
                      <button
                        onClick={() => handleRequest(req.id, req.user_id, 'approved')}
                        disabled={processing === req.id}
                        className="flex items-center gap-1 bg-blue-900 hover:bg-blue-800 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                      >
                        <Check className="w-4 h-4" /> 승인
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Member Management */}
      {tab === 'members' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {members.length === 0 ? (
            <div className="py-16 text-center text-gray-400">멤버가 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {members.map((mem) => (
                <div key={mem.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                    {mem.profile?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{mem.profile?.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {mem.profile?.department} · {mem.profile?.student_id}
                    </p>
                  </div>
                  {myRole === 'president' && mem.role !== 'president' ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={mem.role}
                        onChange={(e) => handleRoleChange(mem.id, mem.user_id, e.target.value as ClubRole)}
                        disabled={processing === mem.id}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        {(['officer', 'member', 'leave', 'graduate'] as ClubRole[]).map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveMember(mem.id, mem.user_id)}
                        disabled={processing === mem.id}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      mem.role === 'president' ? 'bg-blue-100 text-blue-700' :
                      mem.role === 'officer' ? 'bg-purple-50 text-purple-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {ROLE_LABELS[mem.role as ClubRole]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && myRole === 'president' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          {settingsMsg && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              settingsMsg.includes('실패') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {settingsMsg}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">동아리 이름</label>
            <input
              value={settingsForm.name}
              onChange={(e) => setSettingsForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">동아리 소개</label>
            <textarea
              value={settingsForm.description}
              onChange={(e) => setSettingsForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={savingSettings}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white py-3 rounded-xl font-semibold text-sm"
          >
            {savingSettings ? '저장 중...' : '변경사항 저장'}
          </button>
        </form>
      )}
      {tab === 'settings' && myRole !== 'president' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 text-sm">
          동아리 설정은 회장만 변경할 수 있습니다.
        </div>
      )}
    </div>
  )
}
