import { describe, expect, it } from "vitest";
import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { mapServiceErrorCode, toServiceError } from "@/app/services/serviceError";

describe("mapServiceErrorCode", () => {
  it("maps known codes to friendly messages", () => {
    expect(mapServiceErrorCode("COURSE_NOT_FOUND", "Fallback")).toBe(
      "Cours introuvable.",
    );
  });

  it("returns fallback for unknown codes", () => {
    expect(mapServiceErrorCode("UNKNOWN_CODE", "Fallback")).toBe("Fallback");
  });
});

describe("toServiceError", () => {
  it("reads edge function payloads", async () => {
    const error = new FunctionsHttpError(
      new Response(JSON.stringify({ error: "MISSING_COURSE_TEXT" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      toServiceError(error, "Fallback"),
    ).resolves.toMatchObject({
      message:
        "Le cours n'a pas encore de texte exploitable pour preparer des exercices.",
    });
  });

  it("maps transport failures to a stable message", async () => {
    await expect(
      toServiceError(new FunctionsFetchError({}), "Fallback"),
    ).resolves.toMatchObject({
      message: "Le service est temporairement indisponible. Reessaie dans un instant.",
    });
  });
});
