import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  CheckCircle,
  GraduationCap,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { StateCard } from "@/app/components/feedback/StateCard";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ProgressBar } from "@/app/components/ui/ProgressBar";
import { cn } from "@/app/utils/cn";
import {
  getLatestAssignment,
  type AssignmentQuestion,
  type AssignmentRow,
} from "@/app/services/assignmentService";
import { generatePracticeQuiz } from "@/app/services/aiService";
import { setProgress } from "@/app/services/courseService";
import { getErrorMessage } from "@/app/utils/errorMessage";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

type ActiveQuiz = {
  title: string;
  questions: QuizQuestion[];
  isPractice: boolean;
};

function toQuizQuestions(
  questions: AssignmentQuestion[],
  keyPrefix: string,
): QuizQuestion[] {
  return questions.map((q, idx) => ({
    id: `${keyPrefix}:${idx}`,
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
  const [assignment, setAssignment] = useState<AssignmentRow | null>(null);
  const [generating, setGenerating] = useState(false);

  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const questions = activeQuiz?.questions ?? [];
  const question = useMemo(
    () => questions[currentQuestion],
    [questions, currentQuestion],
  );

  const resetSession = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setScore(0);
    setShowResults(false);
    setNotice(null);
  };

  const startQuiz = (quiz: ActiveQuiz) => {
    setActiveQuiz(quiz);
    resetSession();
  };

  const backToMenu = () => {
    setActiveQuiz(null);
    resetSession();
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!courseId) return;
      setError(null);
      setLoading(true);
      try {
        const latest = await getLatestAssignment(courseId);
        if (cancelled) return;
        setAssignment(latest);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const startAssignment = () => {
    if (!assignment) return;
    startQuiz({
      title: assignment.title,
      questions: toQuizQuestions(assignment.questions, assignment.id),
      isPractice: false,
    });
  };

  const startPractice = async () => {
    if (!courseId) return;
    setError(null);
    setGenerating(true);
    try {
      const quiz = await generatePracticeQuiz({ courseId, count: 5 });
      startQuiz({
        title: quiz.title,
        questions: toQuizQuestions(quiz.questions, `practice-${Date.now()}`),
        isPractice: true,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

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

    // Only the teacher's assignment updates official progress; practice quizzes
    // are for self-training and never write to the database.
    if (
      activeQuiz &&
      !activeQuiz.isPractice &&
      profile?.role === "student" &&
      user?.id &&
      courseId &&
      questions.length > 0
    ) {
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
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <StateCard description="Identifiant du cours manquant." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <StateCard description="Chargement des exercices..." loading />
      </div>
    );
  }

  // ---- Results screen ----
  if (activeQuiz && showResults) {
    const percentage =
      questions.length === 0 ? 0 : Math.round((score / questions.length) * 100);

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-success-50 to-white p-4">
        <Card className="w-full max-w-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-accent-400 to-accent-600 p-6 shadow-accent">
              <Trophy className="h-16 w-16 text-white" />
            </div>
          </div>
          <h2 className="mb-2 text-4xl text-ink">Resultats</h2>
          {activeQuiz.isPractice && (
            <p className="mb-4 text-sm text-accent-600">
              Quiz d'entrainement — ce score n'est pas enregistre.
            </p>
          )}
          <p className="mb-6 text-2xl text-ink-soft">
            Score: {score}/{questions.length}
          </p>
          <div className="mb-8">
            <div className="mb-2 text-5xl text-success-600">{percentage}%</div>
            <p className="text-xl text-ink-soft">
              {percentage >= 80
                ? "Excellent travail."
                : percentage >= 60
                  ? "Bon travail. Continue."
                  : "Continue a t'entrainer, tu vas progresser."}
            </p>
          </div>
          <div className="space-y-3">
            {activeQuiz.isPractice ? (
              <Button variant="accent" size="lg" fullWidth loading={generating} onClick={startPractice}>
                {generating ? "Generation..." : "Nouveau quiz d'entrainement"}
              </Button>
            ) : (
              <Button size="lg" fullWidth onClick={() => startQuiz(activeQuiz)}>
                Recommencer
              </Button>
            )}
            <Button variant="secondary" size="lg" fullWidth onClick={backToMenu}>
              Retour aux exercices
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Quiz runner ----
  if (activeQuiz) {
    return (
      <div className="min-h-screen bg-canvas">
        <PageHeader onBack={backToMenu} backLabel="Retour aux exercices">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-2xl text-ink">
              {activeQuiz.isPractice && <Sparkles className="h-6 w-6 text-accent-500" />}
              {activeQuiz.title}
            </h1>
            <span className="text-ink-soft">
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>
          <ProgressBar
            value={((currentQuestion + 1) / questions.length) * 100}
            tone={activeQuiz.isPractice ? "accent" : "brand"}
            className="mt-4"
          />
        </PageHeader>

        <main className="mx-auto max-w-4xl px-4 py-8">
          {notice && (
            <Notice
              message={notice}
              tone={notice.startsWith("Progression") ? "success" : "warning"}
              className="mb-6"
            />
          )}
          {error && <Notice message={error} tone="error" className="mb-6" />}

          {question && (
            <Card className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="mb-8 text-2xl leading-relaxed text-ink">{question.question}</h2>

              <div className="space-y-4">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !showFeedback && setSelectedAnswer(index)}
                    disabled={showFeedback}
                    className={cn(
                      "w-full rounded-xl border-2 p-5 text-left text-lg transition-all",
                      selectedAnswer === index
                        ? showFeedback
                          ? isCorrect
                            ? "border-success-500 bg-success-50"
                            : "border-red-400 bg-red-50"
                          : "border-brand-500 bg-brand-50"
                        : "border-slate-200 bg-white hover:border-slate-300",
                      showFeedback ? "cursor-not-allowed" : "cursor-pointer",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2",
                          selectedAnswer === index
                            ? showFeedback
                              ? isCorrect
                                ? "border-success-500 bg-success-500"
                                : "border-red-400 bg-red-400"
                              : "border-brand-500 bg-brand-500"
                            : "border-slate-300",
                        )}
                      >
                        {selectedAnswer === index && showFeedback &&
                          (isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-white" />
                          ) : (
                            <XCircle className="h-5 w-5 text-white" />
                          ))}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {showFeedback && (
                <div
                  className={cn(
                    "mt-6 rounded-xl border-2 p-5 animate-in fade-in slide-in-from-bottom-1 duration-300",
                    isCorrect
                      ? "border-success-500 bg-success-50"
                      : "border-accent-400 bg-accent-50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-7 w-7 flex-shrink-0 text-success-600" />
                    ) : (
                      <XCircle className="h-7 w-7 flex-shrink-0 text-accent-600" />
                    )}
                    <div>
                      <p className={cn("mb-2 text-xl", isCorrect ? "text-success-700" : "text-accent-600")}>
                        {isCorrect ? "Bonne reponse." : "Pas encore."}
                      </p>
                      <p className={cn("text-lg", isCorrect ? "text-success-700" : "text-accent-600")}>
                        {isCorrect
                          ? "Tu as bien compris. Continue."
                          : "Relis le cours et reessaie."}
                      </p>
                      {question.explanation && (
                        <p className="mt-3 whitespace-pre-line text-lg text-ink-soft">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8">
                {!showFeedback ? (
                  <Button
                    size="lg"
                    fullWidth
                    disabled={selectedAnswer === null}
                    onClick={handleAnswerSubmit}
                  >
                    Valider ma reponse
                  </Button>
                ) : (
                  <Button variant="success" size="lg" fullWidth onClick={handleNextQuestion}>
                    {currentQuestion < questions.length - 1
                      ? "Question suivante"
                      : "Voir mon resultat"}
                  </Button>
                )}
              </div>
            </Card>
          )}
        </main>
      </div>
    );
  }

  // ---- Landing: choose a quiz source ----
  const canPractice = profile?.role !== "teacher";

  return (
    <div className="min-h-screen bg-canvas">
      <PageHeader onBack={() => navigate(`/course/${courseId}`)} backLabel="Retour au cours">
        <h1 className="text-2xl text-ink">Exercices</h1>
      </PageHeader>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {error && <Notice message={error} tone="error" />}

        {/* Teacher's assignment */}
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-400">
          <div className="mb-2 flex items-start gap-3">
            <div className="rounded-xl bg-brand-100 p-2">
              <GraduationCap className="h-6 w-6 text-brand-700" />
            </div>
            <div>
              <h2 className="text-xl text-ink">Devoir de l'enseignant</h2>
              <p className="text-sm text-ink-soft">
                Le quiz prepare par ton enseignant. Ton score met a jour ta progression.
              </p>
            </div>
          </div>

          {assignment ? (
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-lg text-ink">{assignment.title}</div>
                <div className="text-sm text-slate-500">{assignment.questions.length} questions</div>
              </div>
              <Button onClick={startAssignment}>Commencer</Button>
            </div>
          ) : (
            <p className="mt-4 text-ink-soft">
              Aucun devoir n'a encore ete prepare par l'enseignant pour ce cours.
            </p>
          )}
        </Card>

        {/* AI practice quiz (students) */}
        {canPractice && (
          <Card className="border-accent-100 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="mb-2 flex items-start gap-3">
              <div className="rounded-xl bg-accent-100 p-2">
                <Sparkles className="h-6 w-6 text-accent-600" />
              </div>
              <div>
                <h2 className="text-xl text-ink">Quiz d'entrainement IA</h2>
                <p className="text-sm text-ink-soft">
                  Genere ton propre quiz sur ce cours, autant de fois que tu veux.
                  C'est pour t'exercer: ton score ici n'est pas enregistre.
                </p>
              </div>
            </div>
            <Button variant="accent" size="lg" fullWidth loading={generating} onClick={startPractice} className="mt-4">
              {!generating && <Sparkles className="h-6 w-6" />}
              <span>{generating ? "Generation du quiz..." : "Genere-moi un quiz"}</span>
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
