-- Assignments / exercises generated for a course

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Devoir',
  questions jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.assignments enable row level security;

drop policy if exists "Teachers insert assignments" on public.assignments;
create policy "Teachers insert assignments"
on public.assignments
for insert
to authenticated
with check (
  auth.uid() = created_by
  and exists (
    select 1 from public.courses c
    where c.id = public.assignments.course_id and c.teacher_id = auth.uid()
  )
);

drop policy if exists "Teachers read assignments" on public.assignments;
create policy "Teachers read assignments"
on public.assignments
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = public.assignments.course_id and c.teacher_id = auth.uid()
  )
);

drop policy if exists "Students read assignments" on public.assignments;
create policy "Students read assignments"
on public.assignments
for select
to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.course_id = public.assignments.course_id and e.student_id = auth.uid()
  )
);

drop policy if exists "Teachers delete assignments" on public.assignments;
create policy "Teachers delete assignments"
on public.assignments
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = public.assignments.course_id and c.teacher_id = auth.uid()
  )
);

