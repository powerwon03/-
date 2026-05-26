'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_EMOJI, ROLE_LABELS, type ClubRole } from '@/lib/types'
import {
  ArrowLeft, Users, Megaphone, Wallet, Layers, Settings,
  Pin, Plus, ChevronRight, TrendingUp, TrendingDown,
} from 'lucide-react'

type Tab = 'announcements' | 'fees' | 'members' | 'subgroups'

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [club, setClub] = useState<any>(null)
  const [myRole, setMyRole] = useState<ClubRole | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('announcements')
  const [loading, setLoading] = useState(true)

  // Tab data
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [subgroups, setSubgroups] = useState<any[]>([])

  // Forms
  const [showAnnForm, setShowAnnForm] = useState(false)
  const [showFeeForm, setShowFeeForm] = useState(false)
  const [showSubForm, setShowSubForm] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', content: '', is_pinned: false })
  const [feeForm, setFeeForm] = useState({ type: 'income', amount: '', description: '' })
  const [subForm, setSubForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const isOfficer = myRole === 'president' || myRole === 'officer'
  const isPresident = myRole === 'president'

  useEffect(() => {
    init()
  }, [id])

  useEffect(() => {
    if (!club) return
    if (tab === 'announcements') fetchAnnouncements()
    else if (tab === 'fees') fetchFees()
    else if (tab === 'members') fetchMembers()
    else if (tab === 'subgroups') fetchSubgroups()
  }, [tab, club])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id ?? null)

    const { data: clubData } = await supabase
      .from('clubs')
      .select('*, president:profiles(name, email)')
      .eq('id', id)
      .single()
    setClub(clubData)

    if (user) {
      const { data: mem } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', id)
        .eq('user_id', user.id)
        .single()
      setMyRole((mem?.role as ClubRole) ?? null)
    }
    setLoading(false)
  }

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*, author:profiles(name)')
      .eq('club_id', id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
  }

  const fetchFees = async () => {
    const { data } = await supabase
      .from('fee_records')
      .select('*, recorder:profiles(name)')
      .eq('club_id', id)
      .order('created_at', { ascending: false })
    setFees(data ?? [])
  }

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('club_members')
      .select('*, profile:profiles(name, department, student_id)')
      .eq('club_id', id)
      .order('joined_at', { ascending: true })
    setMembers(data ?? [])
  }

  const fetchSubgroups = async () => {
    const { data } = await supabase
      .from('subgroups')
      .select('*, creator:profiles(name)')
      .eq('club_id', id)
      .order('created_at', { ascending: false })
    setSubgroups(data ?? [])
  }

  const submitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('announcements').insert({
      club_id: id,
      author_id: userId,
      title: annForm.title,
      content: annForm.content,
      is_pinned: annForm.is_pinned,
    })
    setAnnForm({ title: '', content: '', is_pinned: false })
    setShowAnnForm(false)
    fetchAnnouncements()
    setSaving(false)
  }

  const submitFee = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('fee_records').insert({
      club_id: id,
      recorder_id: userId,
      type: feeForm.type,
      amount: parseInt(feeForm.amount),
      description: feeForm.description,
    })
    setFeeForm({ type: 'income', amount: '', description: '' })
    setShowFeeForm(false)
    fetchFees()
    setSaving(false)
  }

  const submitSubgroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('subgroups').insert({
      club_id: id,
      creator_id: userId,
      name: subForm.name,
      description: subForm.description || null,
    })
    setSubForm({ name: '', description: '' })
    setShowSubForm(false)
    fetchSubgroups()
    setSaving(false)
  }

  const balance = fees.reduce((acc, f) => f.type === 'income' ? acc + f.amount : acc - f.amount, 0)

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  const fmtMoney = (n: number) => n.toLocaleString('ko-KR') + '원'

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-48 mb-4" />
        <div className="h-32 bg-white rounded-2xl border border-gray-100" />
      </div>
    )
  }

  if (!club) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
        <p className="text-4xl mb-3">😢</p>
        <p>동아리를 찾을 수 없습니다.</p>
        <Link href="/clubs" className="text-blue-700 text-sm mt-2 inline-block">동아리 목록으로</Link>
      </div>
    )
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'announcements', label: '공지사항', icon: <Megaphone className="w-4 h-4" /> },
    { key: 'fees', label: '회비', icon: <Wallet className="w-4 h-4" /> },
    { key: 'members', label: '멤버', icon: <Users className="w-4 h-4" /> },
    { key: 'subgroups', label: '소모임', icon: <Layers className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/clubs" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> 동아리 목록
      </Link>

      {/* Club Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shrink-0">
              {CATEGORY_EMOJI[club.category] ?? '✨'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
                <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {club.category}
                </span>
                {myRole && (
                  <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
                    {ROLE_LABELS[myRole]}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mb-3">{club.description ?? '소개글이 없습니다.'}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {club.member_count}명</span>
                <span>회장: {club.president?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {!myRole && userId && (
              <Link
                href={`/clubs/${id}/join`}
                className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2 rounded-xl font-medium text-sm transition-colors"
              >
                가입 신청
              </Link>
            )}
            {!userId && (
              <Link
                href="/auth/login"
                className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2 rounded-xl font-medium text-sm transition-colors"
              >
                로그인 후 가입
              </Link>
            )}
            {isOfficer && (
              <Link
                href={`/clubs/${id}/manage`}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-xl font-medium text-sm transition-colors"
              >
                <Settings className="w-4 h-4" /> 관리
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs (only for members) */}
      {myRole ? (
        <>
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Announcements */}
          {tab === 'announcements' && (
            <div className="space-y-4">
              {isOfficer && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAnnForm(!showAnnForm)}
                    className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" /> 공지 작성
                  </button>
                </div>
              )}

              {showAnnForm && (
                <form onSubmit={submitAnnouncement} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <input
                    value={annForm.title}
                    onChange={(e) => setAnnForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="제목"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={annForm.content}
                    onChange={(e) => setAnnForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="내용을 입력하세요..."
                    required
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={annForm.is_pinned}
                      onChange={(e) => setAnnForm(f => ({ ...f, is_pinned: e.target.checked }))}
                      className="rounded"
                    />
                    상단 고정
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAnnForm(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium">
                      취소
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white py-2 rounded-xl text-sm font-medium">
                      {saving ? '저장 중...' : '등록'}
                    </button>
                  </div>
                </form>
              )}

              {announcements.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>아직 공지사항이 없습니다.</p>
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-2 mb-2">
                      {ann.is_pinned && <Pin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                      <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap mb-3">{ann.content}</p>
                    <p className="text-xs text-gray-400">
                      {ann.author?.name} · {fmtDate(ann.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Fees */}
          {tab === 'fees' && (
            <div className="space-y-4">
              {/* Balance card */}
              <div className={`rounded-2xl p-6 text-white ${balance >= 0 ? 'bg-blue-900' : 'bg-red-600'}`}>
                <p className="text-blue-200 text-sm mb-1">현재 잔액</p>
                <p className="text-3xl font-bold">{fmtMoney(balance)}</p>
                <div className="flex gap-4 mt-3 text-sm text-blue-200">
                  <span>수입 {fmtMoney(fees.filter(f => f.type === 'income').reduce((a, f) => a + f.amount, 0))}</span>
                  <span>지출 {fmtMoney(fees.filter(f => f.type === 'expense').reduce((a, f) => a + f.amount, 0))}</span>
                </div>
              </div>

              {isOfficer && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowFeeForm(!showFeeForm)}
                    className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" /> 내역 추가
                  </button>
                </div>
              )}

              {showFeeForm && (
                <form onSubmit={submitFee} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setFeeForm(f => ({ ...f, type: 'income' }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${feeForm.type === 'income' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      수입
                    </button>
                    <button type="button" onClick={() => setFeeForm(f => ({ ...f, type: 'expense' }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${feeForm.type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      지출
                    </button>
                  </div>
                  <input
                    type="number"
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="금액 (원)"
                    required
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    value={feeForm.description}
                    onChange={(e) => setFeeForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="내역 (예: 회비 수납, 행사 비용)"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowFeeForm(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium">취소</button>
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white py-2 rounded-xl text-sm font-medium">
                      {saving ? '저장 중...' : '등록'}
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border border-gray-100">
                {fees.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>아직 회비 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {fees.map((fee) => (
                      <div key={fee.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${fee.type === 'income' ? 'bg-blue-50' : 'bg-red-50'}`}>
                            {fee.type === 'income'
                              ? <TrendingUp className="w-4 h-4 text-blue-600" />
                              : <TrendingDown className="w-4 h-4 text-red-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{fee.description}</p>
                            <p className="text-xs text-gray-400">{fee.recorder?.name} · {fmtDate(fee.created_at)}</p>
                          </div>
                        </div>
                        <p className={`font-semibold text-sm ${fee.type === 'income' ? 'text-blue-700' : 'text-red-600'}`}>
                          {fee.type === 'income' ? '+' : '-'}{fmtMoney(fee.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Members */}
          {tab === 'members' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {members.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>멤버가 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {members.map((mem) => (
                    <div key={mem.id} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {mem.profile?.name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{mem.profile?.name}</p>
                          <p className="text-xs text-gray-400">
                            {mem.profile?.department} · {mem.profile?.student_id}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        mem.role === 'president' ? 'bg-blue-100 text-blue-700' :
                        mem.role === 'officer' ? 'bg-purple-50 text-purple-700' :
                        mem.role === 'leave' ? 'bg-yellow-50 text-yellow-700' :
                        mem.role === 'graduate' ? 'bg-gray-100 text-gray-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {ROLE_LABELS[mem.role as ClubRole]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subgroups */}
          {tab === 'subgroups' && (
            <div className="space-y-4">
              {isOfficer && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSubForm(!showSubForm)}
                    className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" /> 소모임 만들기
                  </button>
                </div>
              )}

              {showSubForm && (
                <form onSubmit={submitSubgroup} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <input
                    value={subForm.name}
                    onChange={(e) => setSubForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="소모임 이름"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    value={subForm.description}
                    onChange={(e) => setSubForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="소모임 설명 (선택)"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowSubForm(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium">취소</button>
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white py-2 rounded-xl text-sm font-medium">
                      {saving ? '저장 중...' : '만들기'}
                    </button>
                  </div>
                </form>
              )}

              {subgroups.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>아직 소모임이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subgroups.map((sg) => (
                    <div key={sg.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{sg.name}</h3>
                        {sg.description && <p className="text-sm text-gray-500 mt-0.5">{sg.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">개설: {sg.creator?.name} · {fmtDate(sg.created_at)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium mb-1">멤버만 내용을 볼 수 있어요</p>
          <p className="text-sm mb-4">가입 신청 후 승인을 받으면 공지사항, 회비 등을 확인할 수 있어요.</p>
          {userId ? (
            <Link
              href={`/clubs/${id}/join`}
              className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors inline-block"
            >
              가입 신청하기
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors inline-block"
            >
              로그인하고 가입 신청
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
