'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Eye, EyeOff, CheckCircle } from 'lucide-react'

const DEPARTMENTS = [
  '컴퓨터공학과', '소프트웨어학과', '전기공학부', '기계공학부', '화학공학과',
  '경영학부', '경제학과', '사회학과', '심리학과', '국어국문학과',
  '영어영문학과', '사학과', '수학과', '물리학과', '화학과',
  '생물학과', '의학과', '간호학과', '법학과', '행정학과',
  '기타',
]

const ALLOWED_DOMAINS = ['chungbuk.ac.kr', 'cbnu.ac.kr', 'naver.com', 'gmail.com'] // 개발시 naver/gmail 허용

export default function SignupPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    studentId: '',
    department: '',
    phone: '',
  })

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const validateEmail = (email: string) => {
    const domain = email.split('@')[1]
    return ALLOWED_DOMAINS.includes(domain)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(form.email)) {
      setError('충북대학교 이메일(@chungbuk.ac.kr 또는 @cbnu.ac.kr)을 사용해주세요.')
      return
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (!form.name || !form.studentId || !form.department || !form.phone) {
      setError('모든 항목을 입력해주세요.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? '이미 가입된 이메일입니다.'
        : `가입 오류: ${signUpError.message}`)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: form.email,
        name: form.name,
        student_id: form.studentId,
        department: form.department,
        phone: form.phone,
      })

      if (profileError && !profileError.message.includes('duplicate')) {
        setError('프로필 저장에 실패했습니다. 다시 시도해주세요.')
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setStep('verify')
  }

  if (step === 'verify') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일 인증 필요</h2>
          <p className="text-gray-600 mb-2">
            <span className="font-semibold text-blue-900">{form.email}</span>로 인증 메일을 발송했습니다.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            메일함을 확인하고 인증 링크를 클릭하면 가입이 완료됩니다.
          </p>
          <Link
            href="/auth/login"
            className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-semibold transition-colors inline-block"
          >
            로그인 페이지로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-blue-900 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">개신클럽 회원가입</h1>
          <p className="text-gray-500 text-sm mt-1">충북대학교 이메일로 가입하세요</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학교 이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="example@chungbuk.ac.kr"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">@chungbuk.ac.kr 또는 @cbnu.ac.kr</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={update('password')}
                    placeholder="8자 이상"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.passwordConfirm}
                  onChange={update('passwordConfirm')}
                  placeholder="비밀번호 재입력"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="실명"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학번 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.studentId}
                  onChange={update('studentId')}
                  placeholder="2024XXXXXX"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="010-0000-0000"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학과/부 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.department}
                onChange={update('department')}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="">학과를 선택하세요</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white py-3 rounded-xl font-semibold transition-colors mt-2"
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-blue-700 font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
