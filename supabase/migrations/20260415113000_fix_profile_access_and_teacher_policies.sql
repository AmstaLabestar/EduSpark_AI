-- Fix profile access and role checks on hosted Supabase

create or replace function public.get_my_profile()
returns table (
  id uuid,
  full_name text,
  role public.user_role
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.role
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

drop policy if exists "Teachers insert courses" on public.courses;
create policy "Teachers insert courses"
on public.courses
for insert
to authenticated
with check (
  auth.uid() = teacher_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
);

drop policy if exists "Teachers update courses" on public.courses;
create policy "Teachers update courses"
on public.courses
for update
to authenticated
using (
  auth.uid() = teacher_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
)
with check (
  auth.uid() = teacher_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
);

drop policy if exists "Teachers delete courses" on public.courses;
create policy "Teachers delete courses"
on public.courses
for delete
to authenticated
using (
  auth.uid() = teacher_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
);

drop policy if exists "Students insert own enrollments" on public.enrollments;
create policy "Students insert own enrollments"
on public.enrollments
for insert
to authenticated
with check (
  auth.uid() = student_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'student'
  )
);

drop policy if exists "Students update own progress" on public.enrollments;
create policy "Students update own progress"
on public.enrollments
for update
to authenticated
using (
  auth.uid() = student_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'student'
  )
)
with check (
  auth.uid() = student_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'student'
  )
);

drop policy if exists "Teachers insert assignments" on public.assignments;
create policy "Teachers insert assignments"
on public.assignments
for insert
to authenticated
with check (
  auth.uid() = created_by
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
  and exists (
    select 1
    from public.courses c
    where c.id = public.assignments.course_id
      and c.teacher_id = auth.uid()
  )
);

drop policy if exists "Teachers read assignments" on public.assignments;
create policy "Teachers read assignments"
on public.assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
  and exists (
    select 1
    from public.courses c
    where c.id = public.assignments.course_id
      and c.teacher_id = auth.uid()
  )
);

drop policy if exists "Students read assignments" on public.assignments;
create policy "Students read assignments"
on public.assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'student'
  )
  and exists (
    select 1
    from public.enrollments e
    where e.course_id = public.assignments.course_id
      and e.student_id = auth.uid()
  )
);

drop policy if exists "Teachers delete assignments" on public.assignments;
create policy "Teachers delete assignments"
on public.assignments
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
  and exists (
    select 1
    from public.courses c
    where c.id = public.assignments.course_id
      and c.teacher_id = auth.uid()
  )
);

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
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
  and exists (
    select 1
    from public.courses c
    where c.id::text = split_part(name, '/', 2)
      and c.teacher_id = auth.uid()
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
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
  and exists (
    select 1
    from public.courses c
    where c.id::text = split_part(name, '/', 2)
      and c.teacher_id = auth.uid()
  )
);
