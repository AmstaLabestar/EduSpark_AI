import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

type ErrorPayload = {
  error?: unknown;
  details?: unknown;
};

const errorMessages: Record<string, string> = {
  ANSWER_SERVICE_EMPTY_RESPONSE:
    "Le service de reponse n'a pas renvoye de contenu exploitable.",
  ANSWER_SERVICE_REQUEST_FAILED:
    "Le service de reponse est temporairement indisponible.",
  ASSIGNMENT_STORE_FAILED:
    "Impossible d'enregistrer les exercices pour ce cours.",
  COURSE_FETCH_FAILED: "Impossible de charger ce cours pour le moment.",
  COURSE_NOT_FOUND: "Cours introuvable.",
  FORBIDDEN: "Cette action n'est pas autorisee sur ce cours.",
  HISTORY_FETCH_FAILED: "Impossible de relire l'historique de la discussion.",
  INVALID_ASSIGNMENT_JSON:
    "Le service a renvoye un contenu d'exercice invalide.",
  INVALID_ASSIGNMENT_QUESTIONS:
    "Le service a renvoye une serie d'exercices incomplete.",
  INVALID_ASSIGNMENT_TITLE:
    "Le service a renvoye un titre d'exercice invalide.",
  INVALID_COURSE_ID: "Cours invalide.",
  INVALID_JSON: "Requete invalide.",
  INVALID_QUESTION: "Ta question est trop courte ou invalide.",
  INVALID_AUTH: "Session invalide. Reconnecte-toi.",
  METHOD_NOT_ALLOWED: "Action non autorisee.",
  MISSING_AUTH: "Connexion requise.",
  MISSING_COURSE_TEXT:
    "Le cours n'a pas encore de texte exploitable pour preparer des exercices.",
  MISSING_GOOGLE_API_KEY: "Le service est temporairement indisponible.",
  MISSING_SUPABASE_CONFIG: "Le service est temporairement indisponible.",
  QUESTION_STORE_FAILED:
    "Impossible d'enregistrer cette question pour le moment.",
  STUDENT_ROLE_REQUIRED:
    "Seul un eleve peut rejoindre un cours avec un code.",
  UNHANDLED: "Le service a rencontre un probleme inattendu.",
};

export function mapServiceErrorCode(
  code: string | null | undefined,
  fallback: string,
): string {
  if (!code) return fallback;
  return errorMessages[code] ?? fallback;
}

async function readFunctionPayload(error: FunctionsHttpError): Promise<ErrorPayload | null> {
  const response = error.context as Response | undefined;
  if (!response) return null;

  try {
    return await response.json() as ErrorPayload;
  } catch {
    return null;
  }
}

export async function toServiceError(
  error: unknown,
  fallback: string,
): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    const payload = await readFunctionPayload(error);
    const code =
      typeof payload?.error === "string" ? payload.error : undefined;

    return new Error(mapServiceErrorCode(code, fallback));
  }

  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    return new Error("Le service est temporairement indisponible. Reessaie dans un instant.");
  }

  if (error instanceof Error) {
    return new Error(mapServiceErrorCode(error.message, error.message || fallback));
  }

  return new Error(fallback);
}
