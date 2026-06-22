import { supabase } from "@/app/services/supabaseClient";
import { getFunctionAuthHeaders } from "@/app/services/functionAuth";
import { toServiceError } from "@/app/services/serviceError";
import type { AssignmentQuestion } from "@/app/services/assignmentService";

export type AskAiResult = {
  answer: string;
  questionId: string;
};

export type PracticeQuiz = {
  title: string;
  questions: AssignmentQuestion[];
};

export async function askCourseAi(params: {
  courseId: string;
  question: string;
}): Promise<AskAiResult> {
  const { courseId, question } = params;
  const trimmed = question.trim();
  if (!trimmed) throw new Error("Question vide");

  const headers = await getFunctionAuthHeaders();

  const { data, error } = await supabase.functions.invoke("ask-ai", {
    headers,
    body: { courseId, question: trimmed },
  });

  if (error) {
    throw await toServiceError(
      error,
      "Impossible d'obtenir une reponse pour ce cours.",
    );
  }

  const answer = (data as { answer?: unknown })?.answer;
  const questionId = (data as { questionId?: unknown })?.questionId;

  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("Reponse assistant invalide");
  }
  if (typeof questionId !== "string" || !questionId) {
    throw new Error("QuestionId manquant");
  }

  return { answer: answer.trim(), questionId };
}

/**
 * Generates an ephemeral self-training quiz for the current course.
 * Available to any course member (teacher or enrolled student); nothing is
 * persisted, so it never affects the teacher's assignments or official progress.
 */
export async function generatePracticeQuiz(params: {
  courseId: string;
  count?: number;
}): Promise<PracticeQuiz> {
  const { courseId, count } = params;
  const headers = await getFunctionAuthHeaders();

  const { data, error } = await supabase.functions.invoke("practice-quiz", {
    headers,
    body: { courseId, count },
  });

  if (error) {
    throw await toServiceError(
      error,
      "Impossible de generer un quiz d'entrainement pour ce cours.",
    );
  }

  const title = (data as { title?: unknown })?.title;
  const questions = (data as { questions?: unknown })?.questions;

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Quiz d'entrainement invalide");
  }

  return {
    title: typeof title === "string" && title.trim()
      ? title.trim()
      : "Quiz d'entrainement",
    questions: questions as AssignmentQuestion[],
  };
}
