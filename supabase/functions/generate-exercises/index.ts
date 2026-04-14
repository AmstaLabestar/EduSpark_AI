/// <reference lib="deno.ns" />

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type GenerateBody = {
  courseId: string;
  count?: number;
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
  }
  return trimmed;
}

async function callExerciseGenerationService(params: {
  apiKey: string;
  prompt: string;
}): Promise<string> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": params.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: params.prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    },
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } })?.error?.message ??
      "EXERCISE_SERVICE_REQUEST_FAILED";
    throw new Error(msg);
  }

  const content = (json as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  })?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content || typeof content !== "string") {
    throw new Error("EXERCISE_SERVICE_EMPTY_RESPONSE");
  }

  return content.trim();
}

function validateAssignment(payload: unknown): {
  title: string;
  questions: Array<{
    type: "mcq";
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }>;
} {
  if (!payload || typeof payload !== "object") {
    throw new Error("INVALID_ASSIGNMENT_JSON");
  }

  const title = (payload as { title?: unknown }).title;
  const questions = (payload as { questions?: unknown }).questions;

  if (typeof title !== "string" || title.trim().length < 2) {
    throw new Error("INVALID_ASSIGNMENT_TITLE");
  }
  if (!Array.isArray(questions) || questions.length < 3) {
    throw new Error("INVALID_ASSIGNMENT_QUESTIONS");
  }

  const normalized = questions.map((q) => {
    if (!q || typeof q !== "object") throw new Error("INVALID_QUESTION");
    const type = (q as { type?: unknown }).type;
    const question = (q as { question?: unknown }).question;
    const options = (q as { options?: unknown }).options;
    const correctIndex = (q as { correctIndex?: unknown }).correctIndex;
    const explanation = (q as { explanation?: unknown }).explanation;

    if (type !== "mcq") throw new Error("ONLY_MCQ_SUPPORTED");
    if (typeof question !== "string" || question.trim().length < 5) {
      throw new Error("INVALID_QUESTION_TEXT");
    }
    if (!Array.isArray(options) || options.length < 3) {
      throw new Error("INVALID_OPTIONS");
    }
    const optStrings = options.map((o) => String(o));
    if (
      typeof correctIndex !== "number" ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= optStrings.length
    ) {
      throw new Error("INVALID_CORRECT_INDEX");
    }

    return {
      type: "mcq" as const,
      question: question.trim(),
      options: optStrings.map((o) => o.trim()),
      correctIndex,
      ...(typeof explanation === "string" && explanation.trim()
        ? { explanation: explanation.trim() }
        : {}),
    };
  });

  return { title: title.trim(), questions: normalized };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    if (!authHeader) {
      return jsonResponse({ error: "MISSING_AUTH" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "INVALID_AUTH" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as GenerateBody | null;
    if (!body?.courseId || typeof body.courseId !== "string") {
      return jsonResponse({ error: "INVALID_COURSE_ID" }, { status: 400 });
    }
    const requestedCount = typeof body.count === "number" ? body.count : 5;
    const count = Math.max(3, Math.min(8, Math.round(requestedCount)));

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id,title,description,content_text,teacher_id")
      .eq("id", body.courseId.trim())
      .maybeSingle();

    if (courseError) {
      return jsonResponse(
        { error: "COURSE_FETCH_FAILED", details: courseError.message },
        { status: 500 },
      );
    }
    if (!course) return jsonResponse({ error: "COURSE_NOT_FOUND" }, { status: 404 });

    if (course.teacher_id !== userData.user.id) {
      return jsonResponse({ error: "FORBIDDEN" }, { status: 403 });
    }

    const courseText = (course.content_text ?? "").trim();
    if (!courseText) {
      return jsonResponse({ error: "MISSING_COURSE_TEXT" }, { status: 400 });
    }

    const generationApiKey = Deno.env.get("GOOGLE_API_KEY") ?? "";
    if (!generationApiKey) {
      return jsonResponse({ error: "MISSING_GOOGLE_API_KEY" }, { status: 500 });
    }

    const systemPrompt =
      `Tu es un professeur qui cree un devoir (QCM) pour des eleves du college/lycee.\n` +
      `Tu dois utiliser uniquement le CONTENU DU COURS.\n` +
      `Tu dois repondre en JSON STRICT, sans markdown, sans texte autour.\n\n` +
      `Format attendu:\n` +
      `{\n` +
      `  "title": "Devoir: ...",\n` +
      `  "questions": [\n` +
      `    {\n` +
      `      "type": "mcq",\n` +
      `      "question": "...",\n` +
      `      "options": ["A", "B", "C", "D"],\n` +
      `      "correctIndex": 0,\n` +
      `      "explanation": "..." \n` +
      `    }\n` +
      `  ]\n` +
      `}\n\n` +
      `Contraintes:\n` +
      `- ${count} questions.\n` +
      `- 4 options par question.\n` +
      `- Niveau: simple, clair.\n` +
      `- Les mauvaises options doivent etre plausibles.\n`;

    const userPrompt =
      `Titre du cours: ${course.title}\n` +
      `Description: ${course.description ?? ""}\n\n` +
      `CONTENU DU COURS:\n\n${courseText.slice(0, 24000)}`;

    const fullPrompt = systemPrompt + userPrompt;

    const raw = await callExerciseGenerationService({
      apiKey: generationApiKey,
      prompt: fullPrompt,
    });

    const parsed = JSON.parse(stripCodeFences(raw));
    const assignment = validateAssignment(parsed);

    const { data: inserted, error: insertError } = await supabase
      .from("assignments")
      .insert({
        course_id: course.id,
        created_by: userData.user.id,
        title: assignment.title,
        questions: assignment.questions,
      })
      .select("id")
      .single();

    if (insertError) {
      return jsonResponse(
        { error: "ASSIGNMENT_STORE_FAILED", details: insertError.message },
        { status: 500 },
      );
    }

    return jsonResponse({
      assignmentId: inserted.id,
      title: assignment.title,
      questions: assignment.questions,
    });
  } catch (err) {
    return jsonResponse(
      { error: "UNHANDLED", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
});
