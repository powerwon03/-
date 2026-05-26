'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle } from 'lucide-react'

const DEPARTMENTS = [
  '컴퓨터공학과', '소프트웨어학과', '전기공학부', '기계공학부', '화학공학과',
  '경영학부', '경제학과', '사회학과', '심리학과', '국어국문학과',
  '영어영문학과', '사학과', '수학과', '물리학과', '화학과',
  '생물학과', '의학과', '간호학과', '법학과', '행정학과', '기타',
]

export default function JoinClubPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    department: '',
    studentId: '',
    isPresidentClaim: false,
    message: '',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?redirect=/clubs/${id}/join`)
        return
      }

      // 이미 멤버인지 확인
      const { data: existing } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', id)
        .eq('user_id', user.id)
        .single()
      if (existing) {
        router.push(`/clubs/${id}`)
        return
      }

      // 이미 신청 중인지 확인
      const { data: pendingReq } = await supabase
        .from('join_requests')
        .select('id, status')
        .eq('club_id', id)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()
      if (pendingReq) {
        setDone(true)
        setLoading(false)
        return
      }

      // 프로필에서 기본값 채우기
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone, department, student_id')
        .eq('id', user.id)
        .single()
      if (profile) {
        setForm(f => ({
          ...f,
          name: profile.name,
          phone: profile.phone,
          department: profile.department,
          studentId: profile.student_id,
        }))
      }

      // 동아리 정보
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name, category')
        .eq('id', id)
        .single()
      setClub(clubData)
      setLoading(false)
    }
    init()
  }, [id])

  const update = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: reqError } = await supabase.from('join_requests').insert({
      club_id: id,
      user_id: user.id,
      name: form.name,
      phone: form.phone,
      department: form.department,
      student_id: form.studentId,
      is_president_claim: form.isPresidentClaim,
      message: form.message || null,
      status: 'pending',
    })

    if (reqError) {
      setError('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
      setSubmitting(false)
      return
    }

    setDone(true)
    setSubmitting(false)
  }

  if (loading) return <div className="max-w-lg mx-auto px-4 py-8 text-center text-gray-400">불러오는 중...</div>

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">신청 완료!</h2>
          <p className="text-gray-600 mb-2">
            <span className="font-semibold">{club?.name}</span> 가입 신청이 접수되었습니다.
          </p>
          <p className="text-gray-500 text-sm mb-8">회장이 승인하면 멤버로 활동할 수 있습니다.</p>
          <div className="flex gap-3">
            <Link href="/clubs" className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium text-sm">
              동아리 목록
            </Link>
            <Link href={`/clubs/${id}`} className="flex-1 text-center bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-xl font-medium text-sm">
              동아리 보기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href={`/clubs/${id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> {club?.name}으로 돌아가기
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">가입 신청</h1>
        <p className="text-gray-500 text-sm mb-8">
          <span className="font-semibold text-blue-900">{club?.name}</span>에 가입 신청합니다.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={update('name')}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.phone}
              onChange={update('phone')}
              placeholder="010-0000-0000"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학과 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.department}
              onChange={update('department')}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">학과를 선택하세요</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학번 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.studentId}
              onChange={update('studentId')}
              placeholder="2024XXXXXX"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">지원 동기 (선택)</label>
            <textarea
              value={form.message}
              onChange={update('message')}
              placeholder="가입 동기나 자기소개를 적어주세요."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* President claim checkbox */}
          <div className="bg-blue-50 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPresidentClaim}
                onChange={(e) => setForm(f => ({ ...f, isPresidentClaim: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded accent-blue-900"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">저는 이 동아리의 회장입니다</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  기존 동아리의 회장으로서 동아리를 등록하는 경우 체크하세요. 방장이 확인 후 역할을 부여합니다.
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href={`/clubs/${id}`}
              className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white py-3 rounded-xl font-semibold text-sm"
            >
              {submitting ? '신청 중...' : '가입 신청'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
