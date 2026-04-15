import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/app/auth/AuthProvider";
import type { UserRole } from "@/app/auth/authTypes";
import { StateCard } from "@/app/components/feedback/StateCard";

export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: UserRole;
}) {
  const location = useLocation();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <StateCard description="Chargement..." className="text-center" />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    const qs = new URLSearchParams();
    qs.set("next", next);
    if (role) qs.set("type", role);
    return <Navigate to={`/login?${qs.toString()}`} replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <StateCard
          title="Profil introuvable"
          description="Ton compte existe, mais le profil n'est pas disponible. Essaie de te reconnecter."
          className="text-center max-w-md"
        />
      </div>
    );
  }

  if (role && profile.role !== role) {
    const redirect = profile.role === "teacher"
      ? "/teacher-dashboard"
      : "/student-dashboard";
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
