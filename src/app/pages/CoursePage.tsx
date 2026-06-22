import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { BookOpen, FileText, MessageCircle, PenTool } from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { PageSectionState } from "@/app/components/feedback/PageSectionState";
import { StateCard } from "@/app/components/feedback/StateCard";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";
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
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <StateCard description="Identifiant du cours manquant." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <PageHeader onBack={() => navigate(backTo)}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-600 p-2 shadow-soft">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl text-ink">{course?.title ?? "Cours"}</h1>
            <p className="text-ink-soft">
              {course?.teacher?.full_name ? `Enseignant: ${course.teacher.full_name}` : ""}
            </p>
          </div>
          {profile?.role === "teacher" && course?.course_code && (
            <div className="text-right">
              <div className="mb-1 text-sm text-ink-soft">Code</div>
              <Badge tone="brand" className="font-mono">{course.course_code}</Badge>
            </div>
          )}
        </div>
      </PageHeader>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {error && <Notice message={error} tone="error" className="mb-6" />}

        {loading ? (
          <PageSectionState description="Chargement..." />
        ) : !course ? (
          <PageSectionState description="Cours introuvable." />
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {course.pdf_path && (
              <Card className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-brand-100 p-2">
                    <FileText className="h-6 w-6 text-brand-700" />
                  </div>
                  <div>
                    <div className="text-lg text-ink">Support PDF</div>
                    <div className="text-sm text-ink-soft">Ouvrir le PDF du cours</div>
                  </div>
                </div>
                <Button onClick={handleOpenPdf} loading={pdfLoading}>
                  {pdfLoading ? "Ouverture..." : "Voir PDF"}
                </Button>
              </Card>
            )}

            <Card className="p-8">
              <h2 className="mb-4 text-xl text-ink">Texte du cours</h2>
              {course.content_text ? (
                <div className="space-y-4">
                  {course.content_text.split("\n\n").map((paragraph, index) => (
                    <p
                      key={index}
                      className="whitespace-pre-line text-lg leading-relaxed text-ink-soft"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-lg text-ink-soft">
                  Aucun texte n'est disponible pour ce cours pour le moment.
                </p>
              )}
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Button
                size="lg"
                className="py-5 text-xl"
                onClick={() => navigate(`/chat/${courseId}`)}
              >
                <MessageCircle className="h-7 w-7" />
                <span>Poser une question a l'assistant</span>
              </Button>

              <Button
                size="lg"
                variant="success"
                className="py-5 text-xl"
                onClick={() => navigate(`/exercises/${courseId}`)}
              >
                <PenTool className="h-7 w-7" />
                <span>S'entrainer</span>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
