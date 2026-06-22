import { useNavigate } from "react-router";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      {/* Soft brand glows in the background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-accent-200/40 blur-3xl"
      />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="mb-8 flex justify-center">
            <div className="rounded-3xl bg-brand-600 p-6 shadow-brand">
              <GraduationCap className="h-16 w-16 text-white" />
            </div>
          </div>

          <h1 className="mb-4 text-4xl text-ink md:text-5xl">
            EduLearn <span className="text-brand-600">BF</span>
          </h1>

          <p className="mx-auto mb-12 max-w-xl text-xl leading-relaxed text-ink-soft md:text-2xl">
            Apprends, revise et comprends tes cours avec un accompagnement clair
          </p>

          <div className="mx-auto max-w-md space-y-4">
            <Button
              size="lg"
              fullWidth
              onClick={() => navigate("/login?type=student")}
            >
              <BookOpen className="h-6 w-6" />
              <span>Je suis eleve</span>
            </Button>

            <Button
              size="lg"
              variant="success"
              fullWidth
              onClick={() => navigate("/login?type=teacher")}
            >
              <GraduationCap className="h-6 w-6" />
              <span>Je suis enseignant</span>
            </Button>
          </div>

          <p className="mt-10 inline-flex items-center gap-2 text-sm text-ink-soft">
            <Sparkles className="h-4 w-4 text-accent-500" />
            Tuteur IA contextualise a ton cours
          </p>
        </div>
      </div>
    </div>
  );
}
