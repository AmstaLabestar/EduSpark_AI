-- Stable read path for a course detail page

create or replace function public.get_course_details(
  p_course_id uuid
)
returns table (
  id uuid,
  teacher_id uuid,
  title text,
  description text,
  content_text text,
  pdf_path text,
  course_code text,
  created_at timestamptz,
  teacher_full_name text
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    c.teacher_id,
    c.title,
    c.description,
    c.content_text,
    c.pdf_path,
    c.course_code,
    c.created_at,
    p.full_name as teacher_full_name
  from public.courses c
  left join public.profiles p on p.id = c.teacher_id
  where c.id = p_course_id
    and public.is_course_member(c.id, auth.uid())
  limit 1
$$;

revoke all on function public.get_course_details(uuid) from public;
grant execute on function public.get_course_details(uuid) to authenticated;
