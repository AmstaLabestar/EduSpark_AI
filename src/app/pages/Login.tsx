import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, GraduationCap, Lock, Mail } from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { TextField } from "@/app/components/ui/TextField";
import { getErrorMessage } from "@/app/utils/errorMessage";

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const userType = searchParams.get("type") || "student";
  const next = searchParams.get("next");
  const isTeacher = userType === "teacher";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(next ? decodeURIComponent(next) : "/app");
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
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
            >
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>

          <h2 className="mb-2 text-center text-3xl text-ink">Se connecter</h2>
          <p className="mb-8 text-center text-ink-soft">
            Espace {isTeacher ? "Enseignant" : "Eleve"}
          </p>

          {message && <Notice message={message} tone="error" className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              autoComplete="username"
              required
            />
            <TextField
              label="Mot de passe"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={submitting}
              variant={isTeacher ? "success" : "primary"}
              className="mt-6"
            >
              {submitting ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate(`/signup?type=${userType}`)}
              className="text-brand-600 transition-colors hover:text-brand-700"
            >
              Creer un compte
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
