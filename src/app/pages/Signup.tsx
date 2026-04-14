import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, GraduationCap, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import type { UserRole } from "@/app/auth/authTypes";

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

  const theme = role === "teacher"
    ? {
      backLink: "text-green-600 hover:text-green-700",
      logoBg: "bg-green-600",
      focusBorder: "focus:border-green-500",
      submitBtn:
        "bg-green-600 hover:bg-green-700 disabled:hover:bg-green-600",
    }
    : {
      backLink: "text-blue-600 hover:text-blue-700",
      logoBg: "bg-blue-600",
      focusBorder: "focus:border-blue-500",
      submitBtn: "bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600",
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const result = await signUp({
        email,
        password,
        fullName,
        role,
      });

      if (result.needsEmailConfirmation) {
        setMessage(
          "Compte cree. Verifie ton email pour confirmer l'inscription, puis connecte-toi.",
        );
        return;
      }

      navigate("/app");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate("/")}
          className={`mb-6 flex items-center gap-2 ${theme.backLink}`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div
              className={`${theme.logoBg} rounded-2xl p-4`}
              aria-hidden="true"
            >
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>

          <h2 className="text-3xl text-center mb-2 text-gray-900">
            Creer un compte
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {role === "student" ? "Espace Eleve" : "Espace Enseignant"}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`py-3 rounded-xl border-2 text-lg transition-all ${
                role === "student"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              Eleve
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`py-3 rounded-xl border-2 text-lg transition-all ${
                role === "teacher"
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              Enseignant
            </button>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border-2 border-yellow-300 bg-yellow-50 p-4 text-gray-900">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 text-lg">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  className={`w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg ${theme.focusBorder} focus:outline-none`}
                  placeholder="Ex: Aminata Sawadogo"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 text-lg">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className={`w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg ${theme.focusBorder} focus:outline-none`}
                  placeholder="exemple@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 text-lg">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className={`w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg ${theme.focusBorder} focus:outline-none`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full ${theme.submitBtn} disabled:opacity-60 text-white py-4 px-6 rounded-xl text-xl transition-all shadow-lg hover:shadow-xl mt-2`}
            >
              {submitting ? "Creation..." : "Creer mon compte"}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-700 text-lg"
            >
              Deja un compte ? Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
