import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/app/auth/AuthProvider";
import type { UserRole } from "@/app/auth/authTypes";

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
        <div className="bg-white rounded-2xl shadow-md p-6 text-center">
          <p className="text-lg text-gray-800">Chargement...</p>
        </div>
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
        <div className="bg-white rounded-2xl shadow-md p-6 text-center max-w-md">
          <p className="text-lg text-gray-900 mb-2">Profil introuvable</p>
          <p className="text-gray-600">
            Ton compte existe, mais le profil n&apos;est pas disponible. Essaie de
            te reconnecter.
          </p>
        </div>
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
