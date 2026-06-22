-- RAG support: vector store for course chunks.
--
-- Hybrid retrieval: ask-ai embeds the question, finds the most similar chunks
-- via cosine distance, and falls back to the full course text when a course has
-- no chunks indexed yet. Short courses simply retrieve all their (few) chunks,
-- so answer quality never regresses versus full-text injection.

create extension if not exists vector;

create table if not exists public.course_chunks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index if not exists course_chunks_course_id_idx
  on public.course_chunks (course_id);

-- Approximate nearest-neighbour index for cosine similarity search.
create index if not exists course_chunks_embedding_idx
  on public.course_chunks using hnsw (embedding vector_cosine_ops);

alter table public.course_chunks enable row level security;

drop policy if exists "Course members read chunks" on public.course_chunks;
create policy "Course members read chunks"
on public.course_chunks
for select
to authenticated
using (public.is_course_member(course_id, auth.uid()));

drop policy if exists "Teachers insert course chunks" on public.course_chunks;
create policy "Teachers insert course chunks"
on public.course_chunks
for insert
to authenticated
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_id and c.teacher_id = auth.uid()
  )
);

drop policy if exists "Teachers delete course chunks" on public.course_chunks;
create policy "Teachers delete course chunks"
on public.course_chunks
for delete
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id and c.teacher_id = auth.uid()
  )
);

-- Cosine-similarity search, scoped to a course. SECURITY DEFINER to keep the
-- ANN index usable, but membership is still enforced via is_course_member so it
-- is safe to grant to all authenticated users.
create or replace function public.match_course_chunks(
  p_course_id uuid,
  p_query_embedding vector(768),
  p_match_count int default 8
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.content,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from public.course_chunks c
  where c.course_id = p_course_id
    and c.embedding is not null
    and public.is_course_member(p_course_id, auth.uid())
  order by c.embedding <=> p_query_embedding
  limit greatest(1, least(coalesce(p_match_count, 8), 20));
$$;

revoke all on function public.match_course_chunks(uuid, vector, int) from public;
grant execute on function public.match_course_chunks(uuid, vector, int) to authenticated;
