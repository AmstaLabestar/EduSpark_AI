const maxPdfSize = 10 * 1024 * 1024;

export function validatePdfFile(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return "Le fichier doit etre un PDF.";
  }

  if (file.size > maxPdfSize) {
    return "Le fichier depasse la taille maximale de 10 MB.";
  }

  return null;
}

export function validateCourseStepOne(params: {
  title: string;
  description: string;
}): string | null {
  if (!params.title.trim()) {
    return "Ajoute un titre au cours.";
  }

  if (!params.description.trim()) {
    return "Ajoute une courte description du cours.";
  }

  return null;
}

export function validateCourseContent(params: {
  contentText: string;
  pdfFile?: File | null;
}): string | null {
  if (!params.contentText.trim() && !params.pdfFile) {
    return "Ajoute un texte de cours ou un PDF avant de continuer.";
  }

  if (params.pdfFile) {
    return validatePdfFile(params.pdfFile);
  }

  return null;
}

export function validateCourseDraft(params: {
  title: string;
  description: string;
  contentText: string;
  pdfFile?: File | null;
}): string | null {
  return (
    validateCourseStepOne(params) ??
    validateCourseContent({
      contentText: params.contentText,
      pdfFile: params.pdfFile,
    })
  );
}
