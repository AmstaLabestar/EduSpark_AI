import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, Copy, FileText, Upload } from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { TextField, TextArea } from "@/app/components/ui/TextField";
import { cn } from "@/app/utils/cn";
import {
  validateCourseContent,
  validateCourseStepOne,
  validatePdfFile,
} from "@/app/services/courseForm";
import { createCourse } from "@/app/services/courseService";
import { getErrorMessage } from "@/app/utils/errorMessage";

export default function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [contentText, setContentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const validationError = validatePdfFile(file);
    if (validationError) {
      setError(validationError);
      setNotice(null);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setNotice(`Fichier selectionne: ${file.name}`);
    setSelectedFile(file);
  };

  const goToContentStep = () => {
    const validationError = validateCourseStepOne({
      title: courseTitle,
      description: courseDescription,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleCreateCourse = async () => {
    if (!user?.id) return;

    const validationError = validateCourseContent({
      contentText,
      pdfFile: selectedFile,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setNotice(null);
    setIsGenerating(true);
    try {
      const course = await createCourse({
        teacherId: user.id,
        title: courseTitle,
        description: courseDescription,
        contentText,
        pdfFile: selectedFile,
      });
      setCreatedCode(course.course_code);
      setCreatedCourseId(course.id);
      setShowSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
        <Card className="w-full max-w-lg p-8 text-center animate-in fade-in zoom-in-95 duration-500">
          {notice && <Notice message={notice} tone="success" className="mb-6" />}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-success-500 p-6 shadow-soft-md">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
          </div>
          <h2 className="mb-4 text-3xl text-ink">Cours cree avec succes</h2>
          <p className="text-xl text-ink-soft">Partage le code du cours avec tes eleves.</p>

          {createdCode && (
            <div className="mt-6 rounded-2xl border border-success-100 bg-success-50 p-5">
              <div className="text-sm text-ink-soft">Code du cours</div>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="rounded-xl border border-success-200 bg-white px-4 py-2 font-mono text-2xl text-ink">
                  {createdCode}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(createdCode);
                      setNotice("Code copie. Tu peux maintenant le partager aux eleves.");
                    } catch {
                      setNotice(`Code du cours: ${createdCode}`);
                    }
                  }}
                  className="rounded-xl border border-success-200 bg-white px-4 py-3 text-success-700 transition-all hover:bg-success-50"
                  aria-label="Copier le code"
                >
                  <Copy className="h-6 w-6" />
                </button>
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                Les eleves entrent ce code dans leur tableau de bord.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              variant="success"
              size="lg"
              fullWidth
              onClick={() => (createdCourseId ? navigate(`/course/${createdCourseId}`) : null)}
            >
              Voir le cours
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={() => navigate("/teacher-dashboard")}>
              Retour au tableau de bord
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <PageHeader onBack={() => navigate("/teacher-dashboard")} backLabel="Retour au tableau de bord">
        <h1 className="text-3xl text-ink">Creer un nouveau cours</h1>
      </PageHeader>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {notice && <Notice message={notice} tone="info" className="mb-4" />}
        {error && <Notice message={error} tone="error" className="mb-8" />}

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              step >= 1 ? "bg-success-600 text-white" : "bg-slate-200 text-ink-soft",
            )}>
              1
            </div>
            <span className={step >= 1 ? "text-ink" : "text-slate-500"}>Informations</span>
          </div>
          <div className="mx-4 h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div className={cn("h-1 rounded-full bg-success-600 transition-all duration-500", step >= 2 ? "w-full" : "w-0")} />
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              step >= 2 ? "bg-success-600 text-white" : "bg-slate-200 text-ink-soft",
            )}>
              2
            </div>
            <span className={step >= 2 ? "text-ink" : "text-slate-500"}>Contenu</span>
          </div>
        </div>

        {step === 1 && (
          <Card className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
            <h2 className="mb-6 text-2xl text-ink">Informations du cours</h2>

            <div className="space-y-6">
              <TextField
                label="Titre du cours"
                type="text"
                value={courseTitle}
                onChange={(e) => {
                  setCourseTitle(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex: Mathematiques - Algebre"
              />
              <TextArea
                label="Description"
                value={courseDescription}
                onChange={(e) => {
                  setCourseDescription(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Decris brievement le contenu du cours..."
                rows={4}
              />

              <Button
                variant="success"
                size="lg"
                fullWidth
                onClick={goToContentStep}
                disabled={!courseTitle.trim() || !courseDescription.trim()}
              >
                Continuer
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
            <h2 className="mb-6 text-2xl text-ink">Ajouter le contenu du cours</h2>

            <div className="mb-6">
              <TextArea
                label="Texte du cours (utilise par l'assistant pedagogique)"
                value={contentText}
                onChange={(e) => {
                  setContentText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Colle ici le contenu du cours (ou un resume). L'assistant repond uniquement a partir de ce texte."
                rows={8}
                hint="Conseil: ajoute les definitions, formules, exemples et etapes."
              />
            </div>

            <div className="mb-6">
              <span className="mb-3 block text-lg text-ink-soft">Uploader un fichier PDF</span>
              <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition-all hover:border-success-500">
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-success-100 p-4">
                      <Upload className="h-12 w-12 text-success-600" />
                    </div>
                  </div>
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-success-600">
                      <FileText className="h-5 w-5" />
                      <span className="text-lg">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <p className="mb-2 text-xl text-ink-soft">Cliquez pour choisir un fichier</p>
                      <p className="text-slate-500">Format accepte : PDF (max 10 MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50 p-6">
              <p className="text-lg text-brand-800">
                Le PDF est optionnel. Pour que l'assistant reste dans le contexte du cours,
                il utilise le texte du cours ci-dessus.
              </p>
            </div>

            <div className="flex gap-4">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button
                variant="success"
                size="lg"
                className="flex-1"
                loading={isGenerating}
                disabled={!selectedFile && !contentText.trim()}
                onClick={handleCreateCourse}
              >
                {isGenerating ? "Creation en cours..." : "Creer le cours"}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
