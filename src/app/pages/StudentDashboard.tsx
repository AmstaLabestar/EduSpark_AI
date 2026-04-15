import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  BookOpen,
  LogOut,
  MessageCircle,
  Search,
  User,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { PageSectionState } from "@/app/components/feedback/PageSectionState";
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
    setEnrolling(true);
    try {
      const courseId = await enrollWithCode(courseCode);
      setCourseCode("");
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-xl p-2">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl text-gray-900">EduLearn BF</div>
              <div className="text-sm text-gray-500">Espace eleve</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 rounded-full px-3 py-2">
              <User className="w-5 h-5 text-blue-700" />
              <span className="text-sm text-blue-900">{displayName}</span>
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
          <h1 className="text-3xl mb-2 text-gray-900">Bonjour, {displayName}</h1>
          <p className="text-xl text-gray-600">Choisis un cours pour continuer.</p>
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <label className="block text-lg mb-3 text-gray-700">
              Ajouter un cours avec un code
            </label>
            <form onSubmit={handleEnroll} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="Ex: A1B2C3D4"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={enrolling || !courseCode.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600 text-white px-8 rounded-xl text-lg transition-all"
              >
                {enrolling ? "Ajout..." : "Ajouter"}
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-2">
              Demande le code a ton professeur.
            </p>
          </div>
        </div>

        {error && <Notice message={error} tone="error" className="mb-8" />}

        <div>
          <h2 className="text-2xl mb-6 text-gray-900">Mes cours</h2>

          {loading ? (
            <PageSectionState description="Chargement..." />
          ) : enrollments.length === 0 ? (
            <PageSectionState description="Aucun cours pour le moment. Ajoute un cours avec un code." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => {
                const course = enrollment.course;
                const teacherName = course.teacher?.full_name ?? "Professeur";

                return (
                  <div
                    key={enrollment.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="h-24 bg-gradient-to-br from-blue-500 to-green-500 p-6 text-white">
                      <h3 className="text-xl">{course.title}</h3>
                      <p className="text-blue-50 text-sm">Par {teacherName}</p>
                    </div>

                    <div className="p-6">
                      <div className="mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Progression</span>
                          <span className="text-sm text-blue-700">
                            {enrollment.progress_pct}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${enrollment.progress_pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => navigate(`/course/${course.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-lg transition-all flex items-center justify-center gap-2"
                        >
                          <span>Lire</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/chat/${course.id}`)}
                          className="bg-white border-2 border-blue-200 hover:border-blue-300 text-blue-700 py-3 px-4 rounded-xl text-lg transition-all flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>Assistant</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
