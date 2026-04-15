import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/app/services/supabaseClient";
import { askCourseAi } from "@/app/services/aiService";
import { getErrorMessage } from "@/app/utils/errorMessage";

export type ChatMessage = {
  id: string;
  sender: "user" | "ai";
  text: string;
  createdAt: Date;
  status?: "sent" | "pending" | "error";
};

type QuestionRow = {
  id: string;
  question: string;
  answer: string | null;
  created_at: string;
};

const initialAiMessage: ChatMessage = {
  id: "welcome",
  sender: "ai",
  text: "Bonjour. Pose ta question sur ce cours, et je t'aiderai etape par etape.",
  createdAt: new Date(),
  status: "sent",
};

export function useChat(courseId?: string, userId?: string) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([initialAiMessage]);
  const lastLoadedCourseId = useRef<string | undefined>(undefined);

  const loadHistory = useCallback(async () => {
    if (!courseId) return;

    setError(null);
    setLoading(true);
    try {
      let query = supabase
        .from("questions")
        .select("id,question,answer,created_at")
        .eq("course_id", courseId)
        .order("created_at", { ascending: true });

      if (userId) query = query.eq("user_id", userId);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const rows = (data ?? []) as unknown as QuestionRow[];
      const historyMessages: ChatMessage[] = [initialAiMessage];

      for (const row of rows) {
        historyMessages.push({
          id: `q:${row.id}`,
          sender: "user",
          text: row.question,
          createdAt: new Date(row.created_at),
          status: "sent",
        });
        if (row.answer) {
          historyMessages.push({
            id: `a:${row.id}`,
            sender: "ai",
            text: row.answer,
            createdAt: new Date(row.created_at),
            status: "sent",
          });
        }
      }

      setMessages(historyMessages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId, userId]);

  useEffect(() => {
    if (!courseId) return;
    if (lastLoadedCourseId.current === courseId) return;
    lastLoadedCourseId.current = courseId;
    loadHistory();
  }, [courseId, loadHistory]);

  const canSend = useMemo(() => {
    return !!courseId && !loading && !sending;
  }, [courseId, loading, sending]);

  const send = useCallback(
    async (question: string) => {
      if (!courseId) return;
      const trimmed = question.trim();
      if (!trimmed) return;

      setError(null);
      setSending(true);

      const tempId = `local:${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: `q:${tempId}`,
          sender: "user",
          text: trimmed,
          createdAt: new Date(),
          status: "sent",
        },
        {
          id: `a:${tempId}`,
          sender: "ai",
          text: "Je prepare une reponse claire a partir du cours...",
          createdAt: new Date(),
          status: "pending",
        },
      ]);

      try {
        await askCourseAi({ courseId, question: trimmed });
        await loadHistory();
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === `a:${tempId}`
              ? { ...m, text: `Erreur: ${msg}`, status: "error" }
              : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [courseId, loadHistory],
  );

  return { messages, loading, sending, error, canSend, send, loadHistory };
}
