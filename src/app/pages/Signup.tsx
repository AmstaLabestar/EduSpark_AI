import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, GraduationCap, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import type { UserRole } from "@/app/auth/authTypes";
import { Notice } from "@/app/components/feedback/Notice";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { TextField } from "@/app/components/ui/TextField";
import { cn } from "@/app/utils/cn";
import { getErrorMessage } from "@/app/utils/errorMessage";

export default function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const initialRole = useMemo<UserRole>(() => {
    const type = (searchParams.get("type") ?? "student").toLowerCase();
    return type === "teacher" ? "teacher" : "student";
  }, [searchParams]);

  const [role, setRole] = useState<UserRole>(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isTeacher = role === "teacher";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const result = await signUp({ email, password, fullName, role });

      if (result.needsEmailConfirmation) {
        setMessage(
          "Compte cree. Verifie ton email pour confirmer l'inscription, puis connecte-toi.",
        );
        return;
      }

      navigate("/app");
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const roleButton = (value: UserRole, label: string) => {
    const active = role === value;
    const activeClasses =
      value === "teacher"
        ? "border-success-600 bg-success-50 text-success-700"
        : "border-brand-600 bg-brand-50 text-brand-700";
    return (
      <button
        type="button"
        onClick={() => setRole(value)}
        className={cn(
          "rounded-xl border-2 py-3 text-lg transition-all duration-200",
          active
            ? activeClasses
            : "border-slate-200 text-ink-soft hover:border-slate-300",
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-3 duration-500">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour</span>
        </Button>

        <Card className="p-8" padded={false}>
          <div className="mb-6 flex justify-center">
            <div
              className={`rounded-2xl p-4 ${isTeacher ? "bg-success-600" : "bg-brand-600"}`}
              aria-hidden="true"
            >
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>

          <h2 className="mb-2 text-center text-3xl text-ink">Creer un compte</h2>
          <p className="mb-6 text-center text-ink-soft">
            Espace {isTeacher ? "Enseignant" : "Eleve"}
          </p>

          <div className="mb-6 grid grid-cols-2 gap-3">
            {roleButton("student", "Eleve")}
            {roleButton("teacher", "Enseignant")}
          </div>

          {message && <Notice message={message} tone="warning" className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Nom complet"
              type="text"
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Aminata Sawadogo"
              required
            />
            <TextField
              label="Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              autoComplete="email"
              required
            />
            <TextField
              label="Mot de passe"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
            />

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={submitting}
              variant={isTeacher ? "success" : "primary"}
              className="mt-2"
            >
              {submitting ? "Creation..." : "Creer mon compte"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-brand-600 transition-colors hover:text-brand-700"
            >
              Deja un compte ? Se connecter
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
