import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, GraduationCap, Lock, Mail } from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { Notice } from "@/app/components/feedback/Notice";
import { getErrorMessage } from "@/app/utils/errorMessage";

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const userType = searchParams.get("type") || "student";
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const theme = userType === "teacher"
    ? {
        backLink: "text-green-600 hover:text-green-700",
        focusBorder: "focus:border-green-500",
        link: "text-green-600 hover:text-green-700",
      }
    : {
        backLink: "text-blue-600 hover:text-blue-700",
        focusBorder: "focus:border-blue-500",
        link: "text-blue-600 hover:text-blue-700",
      };

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
              className={`${
                userType === "student" ? "bg-blue-600" : "bg-green-600"
              } rounded-2xl p-4`}
            >
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>

          <h2 className="text-3xl text-center mb-2 text-gray-900">Se connecter</h2>
          <p className="text-center text-gray-600 mb-8">
            Espace {userType === "student" ? "Eleve" : "Enseignant"}
          </p>

          {message && <Notice message={message} tone="error" className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 text-lg">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg ${theme.focusBorder} focus:outline-none`}
                  placeholder="exemple@email.com"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 text-lg">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg ${theme.focusBorder} focus:outline-none`}
                  placeholder="Mot de passe"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full ${
                userType === "student"
                  ? "bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600"
                  : "bg-green-600 hover:bg-green-700 disabled:hover:bg-green-600"
              } disabled:opacity-60 text-white py-4 px-6 rounded-xl text-xl transition-all shadow-lg hover:shadow-xl mt-6`}
            >
              {submitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate(`/signup?type=${userType}`)}
              className={`${theme.link} text-lg`}
            >
              Creer un compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
