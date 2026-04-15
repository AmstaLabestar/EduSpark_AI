import { describe, expect, it } from "vitest";
import {
  validateCourseDraft,
  validateCourseContent,
  validateCourseStepOne,
  validatePdfFile,
} from "@/app/services/courseForm";

describe("courseForm validation", () => {
  it("requires a title and description for step one", () => {
    expect(validateCourseStepOne({ title: "", description: "Desc" })).toBe(
      "Ajoute un titre au cours.",
    );
    expect(validateCourseStepOne({ title: "Maths", description: "" })).toBe(
      "Ajoute une courte description du cours.",
    );
  });

  it("requires text or a pdf for course content", () => {
    expect(validateCourseContent({ contentText: "", pdfFile: null })).toBe(
      "Ajoute un texte de cours ou un PDF avant de continuer.",
    );
  });

  it("validates pdf files", () => {
    const invalid = new File(["hello"], "note.txt", { type: "text/plain" });
    expect(validatePdfFile(invalid)).toBe("Le fichier doit etre un PDF.");
  });

  it("validates the full draft in order", () => {
    expect(
      validateCourseDraft({
        title: "",
        description: "",
        contentText: "",
        pdfFile: null,
      }),
    ).toBe("Ajoute un titre au cours.");
  });
});
