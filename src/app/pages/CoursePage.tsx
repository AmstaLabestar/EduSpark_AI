import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, BookOpen, FileText, MessageCircle, PenTool } from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { PageSectionState } from "@/app/components/feedback/PageSectionState";
import { StateCard } from "@/app/components/feedback/StateCard";
import {
  getCourseById,
  getSignedCoursePdfUrl,
  type CourseRow,
} from "@/app/services/courseService";
import { getErrorMessage } from "@/app/utils/errorMessage";

type CourseWithTeacher = CourseRow & {
  teacher: { full_name: string | null } | null;
};

export default function CoursePage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { profile } = useAuth();

  const [course, setCourse] = useState<CourseWithTeacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const backTo = useMemo(() => {
    return profile?.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard";
  }, [profile?.role]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!courseId) return;
      setError(null);
      setLoading(true);
      try {
        const row = await getCourseById(courseId);
        if (cancelled) return;
        if (!row) {
          setCourse(null);
          setError("Cours introuvable ou inaccessible.");
          return;
        }
        setCourse(row as CourseWithTeacher);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
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

  const handleOpenPdf = async () => {
    if (!course?.pdf_path) return;
    setError(null);
    setPdfLoading(true);
    try {
      const signed = await getSignedCoursePdfUrl({ pdfPath: course.pdf_path });
      window.open(signed, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPdfLoading(false);
    }
  };

  if (!courseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <StateCard description="Identifiant du cours manquant." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg">Retour</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-xl p-2">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl text-gray-900">{course?.title ?? "Cours"}</h1>
              <p className="text-gray-600">
                {course?.teacher?.full_name ? `Enseignant: ${course.teacher.full_name}` : ""}
              </p>
            </div>
            {profile?.role === "teacher" && course?.course_code && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Code</div>
                <div className="font-mono text-sm bg-blue-50 border-2 border-blue-200 px-3 py-1 rounded-full text-blue-800">
                  {course.course_code}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && <Notice message={error} tone="error" className="mb-6" />}

        {loading ? (
          <PageSectionState description="Chargement..." />
        ) : !course ? (
          <PageSectionState description="Cours introuvable." />
        ) : (
          <>
            {course.pdf_path && (
              <div className="bg-white rounded-2xl shadow-md p-6 mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-xl p-2">
                    <FileText className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-gray-900 text-lg">Support PDF</div>
                    <div className="text-gray-600 text-sm">Ouvrir le PDF du cours</div>
                  </div>
                </div>
                <button
                  onClick={handleOpenPdf}
                  disabled={pdfLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600 text-white py-3 px-5 rounded-xl text-lg transition-all"
                >
                  {pdfLoading ? "Ouverture..." : "Voir PDF"}
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
              <h2 className="text-xl text-gray-900 mb-4">Texte du cours</h2>
              {course.content_text ? (
                <div className="space-y-4">
                  {course.content_text.split("\n\n").map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-gray-800 leading-relaxed whitespace-pre-line text-lg"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 text-lg">
                  Aucun texte n'est disponible pour ce cours pour le moment.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate(`/chat/${courseId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-5 px-6 rounded-2xl text-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-7 h-7" />
                <span>Poser une question a l'assistant</span>
              </button>

              <button
                onClick={() => navigate(`/exercises/${courseId}`)}
                className="bg-green-600 hover:bg-green-700 text-white py-5 px-6 rounded-2xl text-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <PenTool className="w-7 h-7" />
                <span>S'entrainer</span>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
