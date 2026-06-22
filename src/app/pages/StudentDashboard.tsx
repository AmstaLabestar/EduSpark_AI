import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, MessageCircle, Search } from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { PageSectionState } from "@/app/components/feedback/PageSectionState";
import { AppHeader } from "@/app/components/ui/AppHeader";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { ProgressBar } from "@/app/components/ui/ProgressBar";
import { enrollWithCode, listMyEnrollments } from "@/app/services/courseService";
import { getErrorMessage } from "@/app/utils/errorMessage";

type EnrollmentItem = Awaited<ReturnType<typeof listMyEnrollments>>[number];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const [courseCode, setCourseCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);

  const displayName = useMemo(() => {
    const name = profile?.full_name?.trim();
    return name ? name : "Eleve";
  }, [profile?.full_name]);

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const rows = await listMyEnrollments();
      setEnrollments(rows);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleEnroll = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim()) return;

    setError(null);
    setNotice(null);
    setEnrolling(true);
    try {
      const courseId = await enrollWithCode(courseCode);
      setCourseCode("");
      setNotice("Cours ajoute. Tu peux maintenant commencer.");
      await refresh();
      navigate(`/course/${courseId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader subtitle="Espace eleve" name={displayName} tone="brand" onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="mb-2 text-3xl text-ink">Bonjour, {displayName}</h1>
          <p className="text-xl text-ink-soft">Choisis un cours pour continuer.</p>
        </div>

        <Card className="mb-8">
          <label htmlFor="course-code" className="mb-3 block text-lg text-ink-soft">
            Ajouter un cours avec un code
          </label>
          <form onSubmit={handleEnroll} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="course-code"
                type="text"
                value={courseCode}
                onChange={(e) => {
                  setCourseCode(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                placeholder="Ex: A1B2C3D4"
                className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-lg uppercase tracking-wide text-ink shadow-soft outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              loading={enrolling}
              disabled={!courseCode.trim()}
            >
              {enrolling ? "Ajout..." : "Ajouter"}
            </Button>
          </form>
          <p className="mt-2 text-sm text-slate-500">Demande le code a ton professeur.</p>
        </Card>

        {notice && <Notice message={notice} tone="success" className="mb-4" />}
        {error && <Notice message={error} tone="error" className="mb-8" />}

        <div>
          <h2 className="mb-6 text-2xl text-ink">Mes cours</h2>

          {loading ? (
            <PageSectionState description="Chargement..." />
          ) : enrollments.length === 0 ? (
            <PageSectionState description="Aucun cours pour le moment. Ajoute un cours avec un code." />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment) => {
                const course = enrollment.course;
                const teacherName = course.teacher?.full_name ?? "Professeur";

                return (
                  <Card
                    key={enrollment.id}
                    padded={false}
                    interactive
                    className="overflow-hidden"
                  >
                    <div className="bg-gradient-to-br from-brand-500 to-success-500 p-6 text-white">
                      <h3 className="text-xl">{course.title}</h3>
                      <p className="text-sm text-white/80">Par {teacherName}</p>
                    </div>

                    <div className="p-6">
                      <div className="mb-4">
                        <div className="mb-2 flex justify-between">
                          <span className="text-sm text-ink-soft">Progression</span>
                          <span className="text-sm text-brand-700">
                            {enrollment.progress_pct}%
                          </span>
                        </div>
                        <ProgressBar value={enrollment.progress_pct} tone="brand" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button onClick={() => navigate(`/course/${course.id}`)}>
                          <span>Lire</span>
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-brand-700"
                          onClick={() => navigate(`/chat/${course.id}`)}
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span>Assistant</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
