import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart3,
  BookOpen,
  Copy,
  Eye,
  Plus,
  RefreshCw,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { PageSectionState } from "@/app/components/feedback/PageSectionState";
import { AppHeader } from "@/app/components/ui/AppHeader";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { ProgressBar } from "@/app/components/ui/ProgressBar";
import { cn } from "@/app/utils/cn";
import {
  listTeacherCourses,
  listTeacherStudents,
} from "@/app/services/courseService";
import { generateExercises } from "@/app/services/assignmentService";
import { getErrorMessage } from "@/app/utils/errorMessage";

type CoursesItem = Awaited<ReturnType<typeof listTeacherCourses>>[number];
type StudentItem = Awaited<ReturnType<typeof listTeacherStudents>>[number];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<"courses" | "students">("courses");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CoursesItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const displayName = useMemo(() => {
    const name = profile?.full_name?.trim();
    return name ? name : "Enseignant";
  }, [profile?.full_name]);

  const refresh = async () => {
    if (!user?.id) return;
    setNotice(null);
    setError(null);
    setLoading(true);
    try {
      const [courseRows, studentRows] = await Promise.all([
        listTeacherCourses(user.id),
        listTeacherStudents(user.id),
      ]);
      setCourses(courseRows);
      setStudents(studentRows);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setNotice("Code copie. Partage-le avec tes eleves.");
      setTimeout(() => setNotice(null), 2500);
    } catch {
      setNotice(`Code: ${code}`);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleGenerateExercises = async (courseId: string) => {
    setError(null);
    setNotice(null);
    setGeneratingFor(courseId);
    try {
      await generateExercises({ courseId, count: 5 });
      setNotice("Exercices generes. Les eleves peuvent maintenant s'entrainer dans le cours.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingFor(null);
    }
  };

  const tabClass = (tab: "courses" | "students") =>
    cn(
      "flex items-center gap-2 px-2 pb-4 text-lg transition-all",
      activeTab === tab
        ? "border-b-2 border-success-600 text-success-700"
        : "text-ink-soft hover:text-ink",
    );

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader subtitle="Espace enseignant" name={displayName} tone="success" onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="mb-2 text-3xl text-ink">Tableau de bord enseignant</h1>
          <p className="text-xl text-ink-soft">
            Cree tes cours, partage le code, et suis la progression.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Button size="lg" variant="success" onClick={() => navigate("/create-course")}>
            <Plus className="h-6 w-6" />
            <span>Creer un nouveau cours</span>
          </Button>
          <Button size="lg" variant="secondary" onClick={refresh}>
            <RefreshCw className="h-5 w-5" />
            <span>Actualiser</span>
          </Button>
        </div>

        {notice && <Notice message={notice} tone="success" className="mb-6" />}
        {error && <Notice message={error} tone="error" className="mb-6" />}

        <div className="mb-6 flex gap-4 border-b border-slate-200">
          <button type="button" onClick={() => setActiveTab("courses")} className={tabClass("courses")}>
            <BookOpen className="h-5 w-5" />
            <span>Mes cours</span>
          </button>
          <button type="button" onClick={() => setActiveTab("students")} className={tabClass("students")}>
            <Users className="h-5 w-5" />
            <span>Mes eleves</span>
          </button>
        </div>

        {loading ? (
          <PageSectionState description="Chargement..." />
        ) : activeTab === "courses" ? (
          courses.length === 0 ? (
            <PageSectionState description="Aucun cours pour le moment. Cree ton premier cours." />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const enrollmentRows = course.enrollments ?? [];
                const studentCount = enrollmentRows.length;
                const avgProgress = studentCount === 0
                  ? 0
                  : Math.round(
                      enrollmentRows.reduce((sum, e) => sum + e.progress_pct, 0) /
                        studentCount,
                    );

                return (
                  <Card key={course.id} padded={false} interactive className="overflow-hidden">
                    <div className="bg-gradient-to-br from-success-500 to-success-600 p-6 text-white">
                      <h3 className="mb-2 text-xl">{course.title}</h3>
                      <div className="flex items-center gap-2 text-white/85">
                        <Users className="h-4 w-4" />
                        <span>{studentCount} eleves</span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-ink-soft">Code du cours</div>
                          <div className="mt-1 inline-block rounded-full bg-success-50 px-3 py-1 font-mono text-sm text-success-700">
                            {course.course_code}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(course.course_code)}
                          className="rounded-xl border border-success-200 bg-white px-3 py-2 text-success-700 transition-all hover:bg-success-50"
                          aria-label="Copier le code"
                        >
                          <Copy className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mb-6">
                        <div className="mb-2 flex justify-between">
                          <span className="text-sm text-ink-soft">Progression moyenne</span>
                          <span className="text-sm text-success-700">{avgProgress}%</span>
                        </div>
                        <ProgressBar value={avgProgress} tone="success" />
                      </div>

                      <div className="space-y-2">
                        <Button variant="success" fullWidth onClick={() => navigate(`/course/${course.id}`)}>
                          <Eye className="h-5 w-5" />
                          <span>Voir le cours</span>
                        </Button>
                        <Button variant="secondary" fullWidth onClick={() => setActiveTab("students")}>
                          <BarChart3 className="h-5 w-5" />
                          <span>Voir progression</span>
                        </Button>
                        <Button
                          variant="accent"
                          fullWidth
                          loading={generatingFor === course.id}
                          onClick={() => handleGenerateExercises(course.id)}
                        >
                          <Sparkles className="h-5 w-5" />
                          <span>
                            {generatingFor === course.id ? "Generation..." : "Generer des exercices"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-ink-soft">Nom de l'eleve</th>
                    <th className="px-6 py-4 text-left text-ink-soft">Cours</th>
                    <th className="px-6 py-4 text-left text-ink-soft">Progression</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((row, idx) => (
                    <tr
                      key={`${row.student.id}-${row.course.id}-${idx}`}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-success-100 p-2">
                            <User className="h-5 w-5 text-success-600" />
                          </div>
                          <span className="text-ink">{row.student.full_name ?? "Eleve"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-ink-soft">{row.course.title}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <ProgressBar value={row.progress_pct} tone="success" className="w-24" />
                          <span className="text-sm text-ink-soft">{row.progress_pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {students.length === 0 && (
                <div className="p-6 text-ink-soft">Aucun eleve inscrit pour le moment.</div>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
