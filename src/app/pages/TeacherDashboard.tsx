import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart3,
  BookOpen,
  Eye,
  LogOut,
  Plus,
  Users,
  User,
  Copy,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { PageSectionState } from "@/app/components/feedback/PageSectionState";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 rounded-xl p-2">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl text-gray-900">EduLearn BF</div>
              <div className="text-sm text-gray-500">Espace enseignant</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-green-50 rounded-full px-3 py-2">
              <User className="w-5 h-5 text-green-700" />
              <span className="text-sm text-green-900">{displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Se deconnecter"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 text-gray-900">Tableau de bord enseignant</h1>
          <p className="text-xl text-gray-600">
            Cree tes cours, partage le code, et suis la progression.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 items-center">
          <button
            onClick={() => navigate("/create-course")}
            className="bg-green-600 hover:bg-green-700 text-white py-4 px-8 rounded-2xl text-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-3"
          >
            <Plus className="w-6 h-6" />
            <span>Creer un nouveau cours</span>
          </button>
          <button
            onClick={refresh}
            className="bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-900 py-4 px-6 rounded-2xl text-xl transition-all"
          >
            Actualiser
          </button>
        </div>

        {notice && <Notice message={notice} tone="success" className="mb-6" />}

        {error && <Notice message={error} tone="error" className="mb-6" />}

        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("courses")}
            className={`pb-4 px-2 text-lg transition-all ${
              activeTab === "courses"
                ? "border-b-2 border-green-600 text-green-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>Mes cours</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`pb-4 px-2 text-lg transition-all ${
              activeTab === "students"
                ? "border-b-2 border-green-600 text-green-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Mes eleves</span>
            </div>
          </button>
        </div>

        {loading ? (
          <PageSectionState description="Chargement..." />
        ) : activeTab === "courses" ? (
          courses.length === 0 ? (
            <PageSectionState description="Aucun cours pour le moment. Cree ton premier cours." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                      <h3 className="text-xl mb-2">{course.title}</h3>
                      <div className="flex items-center gap-2 text-green-100">
                        <Users className="w-4 h-4" />
                        <span>{studentCount} eleves</span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-gray-600">Code du cours</div>
                          <div className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full inline-block mt-1">
                            {course.course_code}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyCode(course.course_code)}
                          className="bg-white border-2 border-green-200 hover:border-green-300 text-green-800 px-3 py-2 rounded-xl transition-all"
                          aria-label="Copier le code"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">
                            Progression moyenne
                          </span>
                          <span className="text-sm text-green-700">
                            {avgProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => navigate(`/course/${course.id}`)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="w-5 h-5" />
                          <span>Voir le cours</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("students")}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <BarChart3 className="w-5 h-5" />
                          <span>Voir progression</span>
                        </button>
                        <button
                          onClick={() => handleGenerateExercises(course.id)}
                          disabled={generatingFor === course.id}
                          className="w-full bg-white border-2 border-purple-200 hover:border-purple-300 disabled:hover:border-purple-200 disabled:opacity-60 text-purple-800 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          <span>
                            {generatingFor === course.id
                              ? "Generation..."
                              : "Generer des exercices"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-700">
                      Nom de l'eleve
                    </th>
                    <th className="px-6 py-4 text-left text-gray-700">Cours</th>
                    <th className="px-6 py-4 text-left text-gray-700">
                      Progression
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((row, idx) => (
                    <tr
                      key={`${row.student.id}-${row.course.id}-${idx}`}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 rounded-full p-2">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="text-gray-900">
                            {row.student.full_name ?? "Eleve"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{row.course.title}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${row.progress_pct}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {row.progress_pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {students.length === 0 && (
                <div className="p-6 text-gray-700">
                  Aucun eleve inscrit pour le moment.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
