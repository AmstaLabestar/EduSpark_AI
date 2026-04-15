import { supabase } from "@/app/services/supabaseClient";

export async function getFunctionAuthHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("Connexion requise.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}
