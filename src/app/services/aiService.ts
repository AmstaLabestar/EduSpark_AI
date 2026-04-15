import { supabase } from "@/app/services/supabaseClient";
import { getFunctionAuthHeaders } from "@/app/services/functionAuth";
import { toServiceError } from "@/app/services/serviceError";

export type AskAiResult = {
  answer: string;
  questionId: string;
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
