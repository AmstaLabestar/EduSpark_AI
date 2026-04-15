import { Navigate } from "react-router";
import { StateCard } from "@/app/components/feedback/StateCard";
import { useAuth } from "@/app/auth/AuthProvider";

export default function AppEntry() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <StateCard description="Chargement..." className="text-center" />
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
