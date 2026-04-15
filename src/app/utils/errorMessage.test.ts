import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/app/utils/errorMessage";

describe("getErrorMessage", () => {
  it("returns the message from an Error instance", () => {
    expect(getErrorMessage(new Error("Connexion impossible"))).toBe(
      "Connexion impossible",
    );
  });

  it("returns a fallback for unknown values", () => {
    expect(getErrorMessage("oops")).toBe("Erreur inconnue");
  });
});
