import { supabase } from "@/app/services/supabaseClient";

export type AssignmentQuestion = {
  type: "mcq";
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type AssignmentRow = {
  id: string;
  course_id: string;
  title: string;
  questions: AssignmentQuestion[];
  created_at: string;
};

export async function generateExercises(params: {
  courseId: string;
  count?: number;
}): Promise<{ assignmentId: string; title: string; questions: AssignmentQuestion[] }> {
  const { courseId, count } = params;
  const { data, error } = await supabase.functions.invoke("generate-exercises", {
    body: { courseId, count },
  });

  if (error) throw error;

  const assignmentId = (data as { assignmentId?: unknown })?.assignmentId;
  const title = (data as { title?: unknown })?.title;
  const questions = (data as { questions?: unknown })?.questions;

  if (typeof assignmentId !== "string" || !assignmentId) {
    throw new Error("assignmentId manquant");
  }
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Titre invalide");
  }
  if (!Array.isArray(questions)) {
    throw new Error("Questions invalides");
  }

  return { assignmentId, title, questions: questions as AssignmentQuestion[] };
}

export async function getLatestAssignment(courseId: string): Promise<AssignmentRow | null> {
  const { data, error } = await supabase
    .from("assignments")
    .select("id,course_id,title,questions,created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as unknown as AssignmentRow | null;
}

