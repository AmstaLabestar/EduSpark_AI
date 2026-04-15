import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle, Trophy, XCircle } from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { StateCard } from "@/app/components/feedback/StateCard";
import {
  getLatestAssignment,
  type AssignmentQuestion,
} from "@/app/services/assignmentService";
import { setProgress } from "@/app/services/courseService";
import { getErrorMessage } from "@/app/utils/errorMessage";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

function toQuizQuestions(
  questions: AssignmentQuestion[],
  assignmentId: string,
): QuizQuestion[] {
  return questions.map((q, idx) => ({
    id: `${assignmentId}:${idx}`,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    ...(q.explanation ? { explanation: q.explanation } : {}),
  }));
}

export default function Exercises() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentAvailable, setAssignmentAvailable] = useState(false);
  const [title, setTitle] = useState("Exercices");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const question = useMemo(() => questions[currentQuestion], [questions, currentQuestion]);

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setScore(0);
    setShowResults(false);
    setNotice(null);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!courseId) return;
      setError(null);
      setLoading(true);
      try {
        const assignment = await getLatestAssignment(courseId);
        if (cancelled) return;

        if (assignment) {
          setTitle(assignment.title);
          setQuestions(toQuizQuestions(assignment.questions, assignment.id));
          setAssignmentAvailable(true);
        } else {
          setTitle("Exercices");
          setQuestions([]);
          setAssignmentAvailable(false);
        }

        resetQuiz();
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setTitle("Exercices");
          setQuestions([]);
          setAssignmentAvailable(false);
          resetQuiz();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || !question) return;
    const correct = selectedAnswer === question.correctIndex;
    setIsCorrect(correct);
    setShowFeedback(true);
    if (correct) setScore((s) => s + 1);
  };

  const handleNextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((i) => i + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      return;
    }

    setShowResults(true);
    if (profile?.role === "student" && user?.id && courseId && questions.length > 0) {
      try {
        const percentage = Math.round((score / questions.length) * 100);
        await setProgress({ courseId, studentId: user.id, progressPct: percentage });
        setNotice("Progression enregistree.");
      } catch {
        setNotice("Resultat affiche, mais la progression n'a pas pu etre enregistree.");
      }
    }
  };

  if (!courseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <StateCard description="Identifiant du cours manquant." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <StateCard description="Chargement des exercices..." />
      </div>
    );
  }

  if (!assignmentAvailable) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-lg">Retour au cours</span>
            </button>
            <h1 className="text-2xl text-gray-900">Exercices</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {error && <Notice message={error} tone="error" className="mb-6" />}
          <div className="bg-white rounded-2xl shadow-md p-8 text-gray-800">
            <h2 className="text-2xl mb-3 text-gray-900">Aucun exercice disponible</h2>
            <p className="text-lg text-gray-700 mb-6">
              Les exercices apparaissent ici une fois prepares par l'enseignant.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Reviens plus tard ou contacte l'enseignant si ce cours doit deja en contenir.
            </p>
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-xl text-lg transition-all"
            >
              Retour au cours
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (showResults) {
    const percentage =
      questions.length === 0 ? 0 : Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-6">
              <Trophy className="w-16 h-16 text-white" />
            </div>
          </div>
          <h2 className="text-4xl mb-4 text-gray-900">Resultats</h2>
          <p className="text-2xl text-gray-700 mb-6">
            Score: {score}/{questions.length}
          </p>
          <div className="mb-8">
            <div className="text-5xl mb-2 text-green-600">{percentage}%</div>
            <p className="text-xl text-gray-600">
              {percentage >= 80
                ? "Excellent travail."
                : percentage >= 60
                  ? "Bon travail. Continue."
                  : "Continue a t'entrainer, tu vas progresser."}
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={resetQuiz}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl text-xl transition-all"
            >
              Recommencer
            </button>
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 py-4 px-6 rounded-xl text-xl transition-all"
            >
              Retour au cours
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg">Retour au cours</span>
          </button>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl text-gray-900">{title}</h1>
            <span className="text-gray-600">
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>

          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {notice && (
          <Notice
            message={notice}
            tone={notice.startsWith("Progression") ? "success" : "warning"}
            className="mb-6"
          />
        )}
        {error && <Notice message={error} tone="error" className="mb-6" />}

        {question && (
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl mb-8 text-gray-900 leading-relaxed">
              {question.question}
            </h2>

            <div className="space-y-4">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showFeedback && setSelectedAnswer(index)}
                  disabled={showFeedback}
                  className={`w-full text-left p-5 rounded-xl text-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? showFeedback
                        ? isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                        : "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  } ${showFeedback ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === index
                          ? showFeedback
                            ? isCorrect
                              ? "border-green-500 bg-green-500"
                              : "border-red-500 bg-red-500"
                            : "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedAnswer === index && showFeedback &&
                        (isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <XCircle className="w-5 h-5 text-white" />
                        ))}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {showFeedback && (
              <div
                className={`mt-6 p-5 rounded-xl ${
                  isCorrect
                    ? "bg-green-50 border-2 border-green-500"
                    : "bg-yellow-50 border-2 border-yellow-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="w-7 h-7 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-7 h-7 text-yellow-600 flex-shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-xl mb-2 ${
                        isCorrect ? "text-green-900" : "text-yellow-900"
                      }`}
                    >
                      {isCorrect ? "Bonne reponse." : "Pas encore."}
                    </p>
                    <p
                      className={`text-lg ${
                        isCorrect ? "text-green-800" : "text-yellow-800"
                      }`}
                    >
                      {isCorrect
                        ? "Tu as bien compris. Continue."
                        : "Relis le cours et reessaie."}
                    </p>
                    {question.explanation && (
                      <p className="text-lg text-gray-800 mt-3 whitespace-pre-line">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              {!showFeedback ? (
                <button
                  onClick={handleAnswerSubmit}
                  disabled={selectedAnswer === null}
                  className={`w-full py-4 px-6 rounded-xl text-xl transition-all ${
                    selectedAnswer !== null
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Valider ma reponse
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl text-xl transition-all"
                >
                  {currentQuestion < questions.length - 1
                    ? "Question suivante"
                    : "Voir mon resultat"}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
