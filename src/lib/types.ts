export type ClubRole = 'president' | 'officer' | 'member' | 'leave' | 'graduate'
export type RequestStatus = 'pending' | 'approved' | 'rejected'
export type FeeType = 'income' | 'expense'

export const ROLE_LABELS: Record<ClubRole, string> = {
  president: '회장',
  officer: '임원',
  member: '부원',
  leave: '휴학생',
  graduate: '졸업생',
}

export interface Profile {
  id: string
  email: string
  name: string
  student_id: string
  department: string
  phone: string
  created_at: string
}

export interface Club {
  id: string
  name: string
  description: string | null
  category: string
  president_id: string
  member_count: number
  is_active: boolean
  created_at: string
}

export interface ClubMember {
  id: string
  club_id: string
  user_id: string
  role: ClubRole
  joined_at: string
  profile?: Profile
}

export interface JoinRequest {
  id: string
  club_id: string
  user_id: string | null
  name: string
  phone: string
  department: string
  student_id: string
  is_president_claim: boolean
  message: string | null
  status: RequestStatus
  created_at: string
}

export interface Announcement {
  id: string
  club_id: string
  author_id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
  author?: Profile
}

export interface FeeRecord {
  id: string
  club_id: string
  recorder_id: string
  type: FeeType
  amount: number
  description: string
  created_at: string
  recorder?: Profile
}

export interface Subgroup {
  id: string
  club_id: string
  name: string
  description: string | null
  creator_id: string
  created_at: string
}

export const CATEGORIES = ['학술', '체육', '문화예술', '봉사', '취미', 'IT/기술', '기타']

export const CATEGORY_EMOJI: Record<string, string> = {
  '학술': '📚',
  '체육': '⚽',
  '문화예술': '🎨',
  '봉사': '🤝',
  '취미': '🎯',
  'IT/기술': '💻',
  '기타': '✨',
}
