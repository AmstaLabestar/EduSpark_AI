import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Bot, Send, User } from "lucide-react";
import { useChat } from "@/app/hooks/useChat";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { StateCard } from "@/app/components/feedback/StateCard";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg">Retour au cours</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-2">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl text-gray-900">Assistant du cours</h1>
              <p className="text-gray-600 text-sm">
                Repond uniquement a partir de ce cours
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {error && <Notice message={error} tone="error" />}
          {loading && <StateCard description="Chargement de la conversation..." />}
          {hasOnlyWelcomeMessage && (
            <StateCard description="Aucune question pour le moment. Ecris ton premier message pour commencer." />
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.sender === "ai" && (
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-2 h-10 w-10 flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              )}

              <div
                className={`max-w-lg px-5 py-3 rounded-2xl ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 shadow-md"
                }`}
              >
                <p className="text-lg leading-relaxed whitespace-pre-line">
                  {message.text}
                </p>
              </div>

              {message.sender === "user" && (
                <div className="bg-blue-600 rounded-full p-2 h-10 w-10 flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ecris ta question ici..."
              disabled={!canSend || loading || sending}
              className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !canSend || loading || sending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600 text-white px-8 rounded-xl transition-all flex items-center gap-2"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-2 text-center">
            {sending ? "Je prepare une reponse..." : "Pose ta question sur le cours."}
          </p>
        </div>
      </div>
    </div>
  );
}
