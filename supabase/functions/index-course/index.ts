/// <reference lib="deno.ns" />

// Indexes a course for RAG: splits its text into chunks, embeds each chunk with
// the Google embeddings API, and stores them in public.course_chunks.
// Teacher-only (RLS also enforces course ownership on insert/delete).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { chunkText, embedText } from "../_shared/rag.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...(init.headers ?? {}) },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "MISSING_SUPABASE_CONFIG" }, { status: 500 });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "MISSING_AUTH" }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "INVALID_AUTH" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as { courseId?: string } | null;
    if (!body?.courseId || typeof body.courseId !== "string") {
      return jsonResponse({ error: "INVALID_COURSE_ID" }, { status: 400 });
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id,content_text,teacher_id")
      .eq("id", body.courseId.trim())
      .maybeSingle();

    if (courseError) {
      return jsonResponse({ error: "COURSE_FETCH_FAILED", details: courseError.message }, { status: 500 });
    }
    if (!course) return jsonResponse({ error: "COURSE_NOT_FOUND" }, { status: 404 });
    if (course.teacher_id !== userData.user.id) {
      return jsonResponse({ error: "FORBIDDEN" }, { status: 403 });
    }

    const apiKey = Deno.env.get("GOOGLE_API_KEY") ?? "";
    if (!apiKey) return jsonResponse({ error: "MISSING_GOOGLE_API_KEY" }, { status: 500 });

    const chunks = chunkText((course.content_text ?? "").trim());

    // Always clear previous chunks so re-indexing reflects the latest text.
    const { error: deleteError } = await supabase
      .from("course_chunks")
      .delete()
      .eq("course_id", course.id);
    if (deleteError) {
      return jsonResponse({ error: "CHUNK_CLEAR_FAILED", details: deleteError.message }, { status: 500 });
    }

    if (chunks.length === 0) {
      return jsonResponse({ courseId: course.id, chunks: 0 });
    }

    const rows: Array<{
      course_id: string;
      chunk_index: number;
      content: string;
      embedding: number[];
    }> = [];

    // Sequential embedding keeps us well under the free-tier rate limits.
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(apiKey, chunks[i]);
      rows.push({
        course_id: course.id,
        chunk_index: i,
        content: chunks[i],
        embedding,
      });
    }

    const { error: insertError } = await supabase.from("course_chunks").insert(rows);
    if (insertError) {
      return jsonResponse({ error: "CHUNK_STORE_FAILED", details: insertError.message }, { status: 500 });
    }

    return jsonResponse({ courseId: course.id, chunks: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNHANDLED";
    return jsonResponse({ error: "INDEX_FAILED", details: message }, { status: 500 });
  }
});
