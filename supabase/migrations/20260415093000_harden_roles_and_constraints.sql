-- Hardening: data constraints and role-aware policies

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'courses_title_not_blank'
  ) then
    alter table public.courses
      add constraint courses_title_not_blank
      check (char_length(btrim(title)) > 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'courses_course_code_format'
  ) then
    alter table public.courses
      add constraint courses_course_code_format
      check (course_code ~ '^[A-F0-9]{8}$');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'enrollments_progress_pct_range'
  ) then
    alter table public.enrollments
      add constraint enrollments_progress_pct_range
      check (progress_pct between 0 and 100);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'questions_question_not_blank'
  ) then
    alter table public.questions
      add constraint questions_question_not_blank
      check (char_length(btrim(question)) > 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assignments_title_not_blank'
  ) then
    alter table public.assignments
      add constraint assignments_title_not_blank
      check (char_length(btrim(title)) > 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assignments_questions_array'
  ) then
    alter table public.assignments
      add constraint assignments_questions_array
      check (
        jsonb_typeof(questions) = 'array'
        and jsonb_array_length(questions) > 0
      );
  end if;
end
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
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if public.current_user_role() is distinct from 'student'::public.user_role then
    raise exception 'STUDENT_ROLE_REQUIRED';
  end if;

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

drop policy if exists "Teachers insert courses" on public.courses;
create policy "Teachers insert courses"
on public.courses
for insert
to authenticated
with check (
  auth.uid() = teacher_id
  and public.current_user_role() = 'teacher'::public.user_role
);

drop policy if exists "Teachers update courses" on public.courses;
create policy "Teachers update courses"
on public.courses
for update
to authenticated
using (
  auth.uid() = teacher_id
  and public.current_user_role() = 'teacher'::public.user_role
)
with check (
  auth.uid() = teacher_id
  and public.current_user_role() = 'teacher'::public.user_role
);

drop policy if exists "Teachers delete courses" on public.courses;
create policy "Teachers delete courses"
on public.courses
for delete
to authenticated
using (
  auth.uid() = teacher_id
  and public.current_user_role() = 'teacher'::public.user_role
);

drop policy if exists "Students insert own enrollments" on public.enrollments;
create policy "Students insert own enrollments"
on public.enrollments
for insert
to authenticated
with check (
  auth.uid() = student_id
  and public.current_user_role() = 'student'::public.user_role
);

drop policy if exists "Students update own progress" on public.enrollments;
create policy "Students update own progress"
on public.enrollments
for update
to authenticated
using (
  auth.uid() = student_id
  and public.current_user_role() = 'student'::public.user_role
)
with check (
  auth.uid() = student_id
  and public.current_user_role() = 'student'::public.user_role
);

drop policy if exists "Course members insert questions" on public.questions;
create policy "Course members insert questions"
on public.questions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.is_course_member(public.questions.course_id, auth.uid())
);

drop policy if exists "Teachers insert assignments" on public.assignments;
create policy "Teachers insert assignments"
on public.assignments
for insert
to authenticated
with check (
  auth.uid() = created_by
  and public.current_user_role() = 'teacher'::public.user_role
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
  public.current_user_role() = 'teacher'::public.user_role
  and exists (
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
  public.current_user_role() = 'student'::public.user_role
  and exists (
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
  public.current_user_role() = 'teacher'::public.user_role
  and exists (
    select 1 from public.courses c
    where c.id = public.assignments.course_id and c.teacher_id = auth.uid()
  )
);

drop policy if exists "Teachers upload course PDFs" on storage.objects;
create policy "Teachers upload course PDFs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'course_pdfs'
  and public.current_user_role() = 'teacher'::public.user_role
  and split_part(name, '/', 1) = 'courses'
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
  and public.current_user_role() = 'teacher'::public.user_role
  and split_part(name, '/', 1) = 'courses'
  and exists (
    select 1
    from public.courses c
    where c.id::text = split_part(name, '/', 2)
      and c.teacher_id = auth.uid()
  )
);
