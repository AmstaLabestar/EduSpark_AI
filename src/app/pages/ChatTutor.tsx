import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { useChat } from "@/app/hooks/useChat";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { StateCard } from "@/app/components/feedback/StateCard";
import { Button } from "@/app/components/ui/Button";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { cn } from "@/app/utils/cn";

export default function ChatTutor() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [inputMessage, setInputMessage] = useState("");
  const { user } = useAuth();
  const { messages, loading, sending, error, canSend, send } = useChat(
    courseId,
    user?.id,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    if (!canSend) return;

    const toSend = inputMessage;
    setInputMessage("");
    await send(toSend);
  };

  if (!courseId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <StateCard
          title="Cours manquant"
          description="Impossible d'ouvrir cette discussion sans identifiant de cours."
        />
      </div>
    );
  }

  const hasOnlyWelcomeMessage =
    !loading && messages.length === 1 && messages[0]?.id === "welcome";

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PageHeader onBack={() => navigate(`/course/${courseId}`)} backLabel="Retour au cours">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-2 shadow-soft">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-2xl text-ink">
              Assistant du cours
              <Sparkles className="h-4 w-4 text-accent-500" />
            </h1>
            <p className="text-sm text-ink-soft">Repond uniquement a partir de ce cours</p>
          </div>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
          {error && <Notice message={error} tone="error" />}
          {loading && <StateCard description="Chargement de la conversation..." loading />}
          {hasOnlyWelcomeMessage && (
            <StateCard description="Aucune question pour le moment. Ecris ton premier message pour commencer." />
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300",
                message.sender === "user" ? "justify-end" : "justify-start",
              )}
            >
              {message.sender === "ai" && (
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 p-2">
                  <Bot className="h-6 w-6 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-lg rounded-2xl px-5 py-3",
                  message.sender === "user"
                    ? "bg-brand-600 text-white shadow-soft"
                    : "border border-slate-100 bg-surface text-ink shadow-soft",
                )}
              >
                <p className="whitespace-pre-line text-lg leading-relaxed">{message.text}</p>
              </div>

              {message.sender === "user" && (
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-brand-600 p-2">
                  <User className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-slate-100 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ecris ta question ici..."
              disabled={!canSend || loading || sending}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-4 text-lg text-ink shadow-soft outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
            <Button
              type="submit"
              size="lg"
              loading={sending}
              disabled={!inputMessage.trim() || !canSend || loading}
              aria-label="Envoyer"
            >
              {!sending && <Send className="h-6 w-6" />}
            </Button>
          </form>
          <p className="mt-2 text-center text-sm text-slate-500">
            {sending ? "Je prepare une reponse..." : "Pose ta question sur le cours."}
          </p>
        </div>
      </div>
    </div>
  );
}
