-- EduIA MVP schema (Supabase)
-- Applies: profiles (users), courses, enrollments, questions, storage bucket + RLS

create extension if not exists "pgcrypto";

do $$
begin
  create type public.user_role as enum ('student', 'teacher');
exception
  when duplicate_object then null;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
begin
  meta_role := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when meta_role = 'teacher' then 'teacher'::public.user_role
      else 'student'::public.user_role
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  content_text text,
  pdf_path text,
  course_code text not null default upper(encode(gen_random_bytes(4), 'hex')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists courses_course_code_key on public.courses(course_code);

drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at
before update on public.courses
for each row execute procedure public.set_updated_at();

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  progress_pct int not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists enrollments_course_student_key on public.enrollments(course_id, student_id);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  answer text,
  created_at timestamptz not null default now()
);

create or replace function public.is_course_member(p_course_id uuid, p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = p_course_id
      and (
        c.teacher_id = p_user_id
        or exists (
          select 1
          from public.enrollments e
          where e.course_id = c.id and e.student_id = p_user_id
        )
      )
  );
$$;

create or replace function public.enroll_with_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
begin
  select c.id
  into v_course_id
  from public.courses c
  where c.course_code = upper(trim(p_code))
  limit 1;

  if v_course_id is null then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  insert into public.enrollments (course_id, student_id)
  values (v_course_id, auth.uid())
  on conflict (course_id, student_id) do nothing;

  return v_course_id;
end;
$$;

revoke all on function public.enroll_with_code(text) from public;
grant execute on function public.enroll_with_code(text) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.questions enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Teachers read students" on public.profiles;
create policy "Teachers read students"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where c.teacher_id = auth.uid()
      and e.student_id = public.profiles.id
  )
);

drop policy if exists "Teachers insert courses" on public.courses;
create policy "Teachers insert courses"
on public.courses
for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "Teachers update courses" on public.courses;
create policy "Teachers update courses"
on public.courses
for update
to authenticated
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

drop policy if exists "Teachers delete courses" on public.courses;
create policy "Teachers delete courses"
on public.courses
for delete
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Course members read courses" on public.courses;
create policy "Course members read courses"
on public.courses
for select
to authenticated
using (public.is_course_member(public.courses.id, auth.uid()));

drop policy if exists "Students read own enrollments" on public.enrollments;
create policy "Students read own enrollments"
on public.enrollments
for select
to authenticated
using (auth.uid() = student_id);

drop policy if exists "Teachers read enrollments" on public.enrollments;
create policy "Teachers read enrollments"
on public.enrollments
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = public.enrollments.course_id
      and c.teacher_id = auth.uid()
  )
);

drop policy if exists "Students insert own enrollments" on public.enrollments;
create policy "Students insert own enrollments"
on public.enrollments
for insert
to authenticated
with check (auth.uid() = student_id);

drop policy if exists "Students update own progress" on public.enrollments;
create policy "Students update own progress"
on public.enrollments
for update
to authenticated
using (auth.uid() = student_id)
with check (auth.uid() = student_id);

drop policy if exists "Course members insert questions" on public.questions;
create policy "Course members insert questions"
on public.questions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.is_course_member(public.questions.course_id, auth.uid())
);

drop policy if exists "Read own questions" on public.questions;
create policy "Read own questions"
on public.questions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Teachers read course questions" on public.questions;
create policy "Teachers read course questions"
on public.questions
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = public.questions.course_id and c.teacher_id = auth.uid()
  )
);

-- Storage bucket + policies
insert into storage.buckets (id, name, public)
values ('course_pdfs', 'course_pdfs', false)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

drop policy if exists "Teachers upload course PDFs" on storage.objects;
create policy "Teachers upload course PDFs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'course_pdfs'
  and split_part(name, '/', 1) = 'courses'
  and exists (
    select 1
    from public.courses c
    where c.id::text = split_part(name, '/', 2)
      and c.teacher_id = auth.uid()
  )
);

drop policy if exists "Course members read PDFs" on storage.objects;
create policy "Course members read PDFs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'course_pdfs'
  and split_part(name, '/', 1) = 'courses'
  and exists (
    select 1
    from public.courses c
    where c.id::text = split_part(name, '/', 2)
      and public.is_course_member(c.id, auth.uid())
  )
);

drop policy if exists "Teachers delete course PDFs" on storage.objects;
create policy "Teachers delete course PDFs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'course_pdfs'
  and split_part(name, '/', 1) = 'courses'
  and exists (
    select 1
    from public.courses c
    where c.id::text = split_part(name, '/', 2)
      and c.teacher_id = auth.uid()
  )
);
