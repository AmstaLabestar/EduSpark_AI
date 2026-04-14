import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, Copy, FileText, Upload } from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { createCourse } from "@/app/services/courseService";

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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const maxSize = 10 * 1024 * 1024;
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Le fichier doit etre un PDF.");
      setSelectedFile(null);
      return;
    }

    if (file.size > maxSize) {
      setError("Le fichier depasse la taille maximale de 10 MB.");
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleCreateCourse = async () => {
    if (!user?.id) return;

    setError(null);
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
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsGenerating(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-green-500 rounded-full p-6">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>
          <h2 className="text-3xl mb-4 text-gray-900">Cours cree avec succes</h2>
          <p className="text-xl text-gray-600">
            Partage le code du cours avec tes eleves.
          </p>

          {createdCode && (
            <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-2xl p-5">
              <div className="text-sm text-gray-700">Code du cours</div>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="font-mono text-2xl bg-white border-2 border-green-200 px-4 py-2 rounded-xl text-gray-900">
                  {createdCode}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(createdCode);
                    } catch {
                      // ignore clipboard failures
                    }
                  }}
                  className="bg-white border-2 border-green-200 hover:border-green-300 text-green-800 px-4 py-3 rounded-xl transition-all"
                  aria-label="Copier le code"
                >
                  <Copy className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Exemple: les eleves entrent ce code dans leur tableau de bord.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={() =>
                createdCourseId ? navigate(`/course/${createdCourseId}`) : null}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl text-xl transition-all shadow-lg hover:shadow-xl"
            >
              Voir le cours
            </button>
            <button
              onClick={() => navigate("/teacher-dashboard")}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 py-4 px-6 rounded-xl text-xl transition-all"
            >
              Retour au tableau de bord
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
            onClick={() => navigate("/teacher-dashboard")}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg">Retour au tableau de bord</span>
          </button>
          <h1 className="text-3xl text-gray-900">Creer un nouveau cours</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-8 rounded-2xl border-2 border-red-300 bg-red-50 p-5 text-gray-900">
            {error}
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <span className={step >= 1 ? "text-gray-900" : "text-gray-500"}>
                Informations
              </span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div
                className={`h-1 transition-all ${
                  step >= 2 ? "bg-green-600 w-full" : "w-0"
                }`}
              />
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
              <span className={step >= 2 ? "text-gray-900" : "text-gray-500"}>
                Contenu
              </span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl mb-6 text-gray-900">Informations du cours</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-lg mb-2 text-gray-700">
                  Titre du cours
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Ex: Mathematiques - Algebre"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-lg mb-2 text-gray-700">
                  Description
                </label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Decris brievement le contenu du cours..."
                  rows={4}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-green-500 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!courseTitle || !courseDescription}
                className={`w-full py-4 px-6 rounded-xl text-xl transition-all ${
                  courseTitle && courseDescription
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl mb-6 text-gray-900">
              Ajouter le contenu du cours
            </h2>

            <div className="mb-6">
              <label className="block text-lg mb-3 text-gray-700">
                Texte du cours (utilise par l'assistant pedagogique)
              </label>
              <textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                placeholder="Colle ici le contenu du cours (ou un resume). L'assistant repond uniquement a partir de ce texte."
                rows={8}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-green-500 focus:outline-none resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">
                Conseil: ajoute les definitions, formules, exemples et etapes.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-lg mb-3 text-gray-700">
                Uploader un fichier PDF
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-green-500 transition-all">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-green-100 rounded-full p-4">
                      <Upload className="w-12 h-12 text-green-600" />
                    </div>
                  </div>
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <FileText className="w-5 h-5" />
                      <span className="text-lg">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-xl text-gray-700 mb-2">
                        Cliquez pour choisir un fichier
                      </p>
                      <p className="text-gray-500">Format accepte : PDF (max 10 MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
              <p className="text-gray-800 text-lg">
                Le PDF est optionnel. Pour que l'assistant reste dans le contexte du
                cours, il utilise le texte du cours ci-dessus.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-4 px-6 rounded-xl text-xl transition-all"
              >
                Retour
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={(!selectedFile && !contentText.trim()) || isGenerating}
                className={`flex-1 py-4 px-6 rounded-xl text-xl transition-all flex items-center justify-center gap-2 ${
                  (selectedFile || contentText.trim()) && !isGenerating
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creation en cours...</span>
                  </>
                ) : (
                  <span>Creer le cours</span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
