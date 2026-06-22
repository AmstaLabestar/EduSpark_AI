-- Fix infinite RLS recursion ("stack depth limit exceeded").
--
-- The "Course members read courses" policy on public.courses calls
-- public.is_course_member(courses.id, auth.uid()). That helper re-queries
-- public.courses, which re-evaluates the same SELECT policy, which calls the
-- helper again -> infinite recursion. Any direct read of public.courses under a
-- user's RLS context (e.g. the ask-ai / generate-exercises edge functions)
-- therefore fails.
--
-- Fix: make the helper SECURITY DEFINER so its internal reads bypass RLS,
-- exactly like get_course_details() and get_my_profile() already do.

create or replace function public.is_course_member(p_course_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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

revoke all on function public.is_course_member(uuid, uuid) from public;
grant execute on function public.is_course_member(uuid, uuid) to authenticated;
