-- ========================================
-- 개신클럽 (Gaesin Club) - Database Schema
-- Supabase SQL Editor에 붙여넣고 실행하세요
-- ========================================

-- 사용자 프로필 (auth.users 와 연동)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text not null,
  student_id text not null,
  department text not null,
  phone text not null,
  created_at timestamptz default now() not null
);

-- 동아리
create table if not exists public.clubs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  category text not null,
  president_id uuid references public.profiles(id),
  member_count int default 1 not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

-- 동아리 멤버
create table if not exists public.club_members (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member',
  joined_at timestamptz default now() not null,
  constraint club_members_role_check check (role in ('president', 'officer', 'member', 'leave', 'graduate')),
  constraint club_members_unique unique (club_id, user_id)
);

-- 가입 신청
create table if not exists public.join_requests (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  department text not null,
  student_id text not null,
  is_president_claim boolean default false not null,
  message text,
  status text not null default 'pending',
  created_at timestamptz default now() not null,
  constraint join_requests_status_check check (status in ('pending', 'approved', 'rejected'))
);

-- 공지사항
create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  author_id uuid references public.profiles(id) not null,
  title text not null,
  content text not null,
  is_pinned boolean default false not null,
  created_at timestamptz default now() not null
);

-- 회비 내역
create table if not exists public.fee_records (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  recorder_id uuid references public.profiles(id) not null,
  type text not null,
  amount int not null,
  description text not null,
  created_at timestamptz default now() not null,
  constraint fee_records_type_check check (type in ('income', 'expense'))
);

-- 소모임 (하위 그룹)
create table if not exists public.subgroups (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  name text not null,
  description text,
  creator_id uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.join_requests enable row level security;
alter table public.announcements enable row level security;
alter table public.fee_records enable row level security;
alter table public.subgroups enable row level security;

-- Profiles 정책
create policy "프로필은 인증된 사용자가 조회 가능" on public.profiles
  for select to authenticated using (true);

create policy "본인 프로필만 생성 가능" on public.profiles
  for insert with check (auth.uid() = id);

create policy "본인 프로필만 수정 가능" on public.profiles
  for update using (auth.uid() = id);

-- Clubs 정책
create policy "동아리는 누구나 조회 가능" on public.clubs
  for select using (true);

create policy "인증된 사용자는 동아리 생성 가능" on public.clubs
  for insert to authenticated with check (true);

create policy "동아리 회장만 수정 가능" on public.clubs
  for update using (auth.uid() = president_id);

-- Club Members 정책
create policy "동아리 멤버 목록 조회 가능" on public.club_members
  for select using (true);

create policy "임원진이 멤버 관리 가능" on public.club_members
  for all to authenticated using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = club_members.club_id
      and cm.user_id = auth.uid()
      and cm.role in ('president', 'officer')
    )
  );

create policy "본인 멤버십 추가 가능" on public.club_members
  for insert to authenticated with check (user_id = auth.uid());

-- Join Requests 정책
create policy "본인 신청 또는 임원진이 가입신청 조회" on public.join_requests
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.club_members cm
      where cm.club_id = join_requests.club_id
      and cm.user_id = auth.uid()
      and cm.role in ('president', 'officer')
    )
  );

create policy "인증된 사용자 가입신청 가능" on public.join_requests
  for insert to authenticated with check (user_id = auth.uid());

create policy "임원진이 가입신청 승인/거절 가능" on public.join_requests
  for update to authenticated using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = join_requests.club_id
      and cm.user_id = auth.uid()
      and cm.role in ('president', 'officer')
    )
  );

-- Announcements 정책
create policy "동아리 멤버만 공지사항 조회" on public.announcements
  for select to authenticated using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = announcements.club_id
      and cm.user_id = auth.uid()
    )
  );

create policy "임원진이 공지사항 작성 가능" on public.announcements
  for insert to authenticated with check (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = announcements.club_id
      and cm.user_id = auth.uid()
      and cm.role in ('president', 'officer')
    )
  );

create policy "임원진이 공지사항 수정/삭제 가능" on public.announcements
  for update to authenticated using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = announcements.club_id
      and cm.user_id = auth.uid()
      and cm.role in ('president', 'officer')
    )
  );

create policy "임원진이 공지사항 삭제 가능" on public.announcements
  for delete to authenticated using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = announcements.club_id
      and cm.user_id = auth.uid()
      and cm.role in ('president', 'officer')
    )
  );

-- Fee Records 정책
create policy "동아리 멤버만 회비 내역 조회" on public.fee_records
  for select to authenticated using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = fee_records.club_id
      and cm.user_id = auth.uid()
    )
  );

create policy "임원진이 회비 내역 추가 가능" on public.fee_records
  for insert to authenticated with check (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = fee_records.club_id
      and cm.user_id = auth.uid()
      and cm.role in ('president', 'officer')
    )
  );

create policy "임원진이 회비 내역 삭제 가능" on public.fee_records
  for delete to authenticated using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = fee_records.club_id
      and cm.user_id = auth.uid()
      and cm.role in ('president', 'officer')
    )
  );

-- Subgroups 정책
create policy "동아리 멤버만 소모임 조회" on public.subgroups
  for select to authenticated using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = subgroups.club_id
      and cm.user_id = auth.uid()
    )
  );

create policy "임원진이 소모임 생성 가능" on public.subgroups
  for insert to authenticated with check (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = subgroups.club_id
      and cm.user_id = auth.uid()
      and cm.role in ('president', 'officer')
    )
  );

create policy "임원진이 소모임 삭제 가능" on public.subgroups
  for delete to authenticated using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = subgroups.club_id
      and cm.user_id = auth.uid()
      and cm.role in ('president', 'officer')
    )
  );

-- ========================================
-- 트리거: 멤버 수 자동 업데이트
-- ========================================

create or replace function public.update_club_member_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.clubs set member_count = member_count + 1 where id = NEW.club_id;
  elsif (TG_OP = 'DELETE') then
    update public.clubs set member_count = greatest(0, member_count - 1) where id = OLD.club_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_club_member_change on public.club_members;
create trigger on_club_member_change
  after insert or delete on public.club_members
  for each row execute function public.update_club_member_count();
