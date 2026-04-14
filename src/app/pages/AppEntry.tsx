import { Navigate } from "react-router";
import { useAuth } from "@/app/auth/AuthProvider";

export default function AppEntry() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-md p-6 text-center">
          <p className="text-lg text-gray-800">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/login" replace />;

  return (
    <Navigate
      to={profile.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard"}
      replace
    />
  );
}

