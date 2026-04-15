-- Stable write path for course creation and PDF attachment

create or replace function public.create_course(
  p_title text,
  p_description text,
  p_content_text text default null
)
returns public.courses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  ) then
    raise exception 'TEACHER_ROLE_REQUIRED';
  end if;

  insert into public.courses (
    teacher_id,
    title,
    description,
    content_text
  )
  values (
    auth.uid(),
    btrim(p_title),
    nullif(btrim(p_description), ''),
    nullif(btrim(coalesce(p_content_text, '')), '')
  )
  returning * into v_course;

  return v_course;
end;
$$;

revoke all on function public.create_course(text, text, text) from public;
grant execute on function public.create_course(text, text, text) to authenticated;

create or replace function public.attach_course_pdf(
  p_course_id uuid,
  p_pdf_path text
)
returns public.courses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  update public.courses
  set pdf_path = p_pdf_path
  where id = p_course_id
    and teacher_id = auth.uid()
  returning * into v_course;

  if v_course.id is null then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  return v_course;
end;
$$;

revoke all on function public.attach_course_pdf(uuid, text) from public;
grant execute on function public.attach_course_pdf(uuid, text) to authenticated;
