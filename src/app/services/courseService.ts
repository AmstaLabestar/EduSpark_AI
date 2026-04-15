import { supabase } from "@/app/services/supabaseClient";
import { mapServiceErrorCode } from "@/app/services/serviceError";

export type UserRole = "student" | "teacher";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  role: UserRole;
};

export type CourseRow = {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  content_text: string | null;
  pdf_path: string | null;
  course_code: string;
  created_at: string;
};

export type EnrollmentRow = {
  id: string;
  course_id: string;
  student_id: string;
  progress_pct: number;
  created_at: string;
};

export async function enrollWithCode(code: string): Promise<string> {
  const cleaned = code.trim();
  if (!cleaned) throw new Error("Code du cours manquant");

  const { data, error } = await supabase.rpc("enroll_with_code", {
    p_code: cleaned,
  });
  if (error) {
    throw new Error(
      mapServiceErrorCode(
        error.message,
        "Impossible de rejoindre ce cours pour le moment.",
      ),
    );
  }
  return data as string;
}

export async function listMyEnrollments(): Promise<
  Array<
    EnrollmentRow & {
      course: Pick<CourseRow, "id" | "title" | "description" | "course_code"> & {
        teacher: Pick<ProfileRow, "full_name"> | null;
      };
    }
  >
> {
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, course_id, student_id, progress_pct, created_at, course:courses(id,title,description,course_code, teacher:profiles(full_name))",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Array<
    EnrollmentRow & {
      course: Pick<CourseRow, "id" | "title" | "description" | "course_code"> & {
        teacher: Pick<ProfileRow, "full_name"> | null;
      };
    }
  >;
}

export async function listTeacherCourses(teacherId: string): Promise<
  Array<
    Pick<CourseRow, "id" | "title" | "course_code" | "created_at"> & {
      enrollments: Array<Pick<EnrollmentRow, "progress_pct">>;
    }
  >
> {
  const { data, error } = await supabase
    .from("courses")
    .select("id,title,course_code,created_at,enrollments(progress_pct)")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Array<
    Pick<CourseRow, "id" | "title" | "course_code" | "created_at"> & {
      enrollments: Array<Pick<EnrollmentRow, "progress_pct">>;
    }
  >;
}

export async function listTeacherStudents(teacherId: string): Promise<
  Array<{
    progress_pct: number;
    created_at: string;
    course: Pick<CourseRow, "id" | "title">;
    student: Pick<ProfileRow, "id" | "full_name">;
  }>
> {
  // RLS: teacher can only see enrollments for their courses
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id")
    .eq("teacher_id", teacherId);

  if (coursesError) throw coursesError;
  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return [];

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "progress_pct, created_at, course:courses(id,title), student:profiles(id,full_name)",
    )
    .in("course_id", courseIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Array<{
    progress_pct: number;
    created_at: string;
    course: Pick<CourseRow, "id" | "title">;
    student: Pick<ProfileRow, "id" | "full_name">;
  }>;
}

export async function getCourseById(courseId: string): Promise<
  (CourseRow & { teacher: Pick<ProfileRow, "full_name"> | null }) | null
> {
  const { data, error } = await supabase
    .from("courses")
    .select("id,teacher_id,title,description,content_text,pdf_path,course_code,created_at, teacher:profiles(full_name)")
    .eq("id", courseId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as (CourseRow & {
    teacher: Pick<ProfileRow, "full_name"> | null;
  }) | null;
}

export async function createCourse(params: {
  teacherId: string;
  title: string;
  description: string;
  contentText: string;
  pdfFile?: File | null;
}): Promise<CourseRow> {
  const { teacherId, title, description, contentText, pdfFile } = params;
  const cleanedContent = contentText.trim();

  const { data: inserted, error: insertError } = await supabase
    .from("courses")
    .insert({
      teacher_id: teacherId,
      title: title.trim(),
      description: description.trim(),
      content_text: cleanedContent ? cleanedContent : null,
    })
    .select(
      "id,teacher_id,title,description,content_text,pdf_path,course_code,created_at",
    )
    .single();

  if (insertError) throw insertError;
  const course = inserted as unknown as CourseRow;

  if (!pdfFile) return course;

  const maxSize = 10 * 1024 * 1024;
  const isPdf =
    pdfFile.type === "application/pdf" || pdfFile.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new Error("Le fichier doit etre un PDF.");
  if (pdfFile.size > maxSize) {
    throw new Error("Le fichier depasse la taille maximale de 10 MB.");
  }

  const safeName = pdfFile.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const objectPath = `courses/${course.id}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("course_pdfs")
    .upload(objectPath, pdfFile, {
      upsert: false,
      contentType: "application/pdf",
    });

  if (uploadError) throw uploadError;

  const { data: updated, error: updateError } = await supabase
    .from("courses")
    .update({ pdf_path: objectPath })
    .eq("id", course.id)
    .select(
      "id,teacher_id,title,description,content_text,pdf_path,course_code,created_at",
    )
    .single();

  if (updateError) throw updateError;
  return updated as unknown as CourseRow;
}

export async function getSignedCoursePdfUrl(params: {
  pdfPath: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const { pdfPath, expiresInSeconds = 60 * 60 } = params;
  const { data, error } = await supabase.storage
    .from("course_pdfs")
    .createSignedUrl(pdfPath, expiresInSeconds);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("URL PDF indisponible");
  return data.signedUrl;
}

export async function setProgress(params: {
  courseId: string;
  studentId: string;
  progressPct: number;
}): Promise<void> {
  const next = Math.max(0, Math.min(100, Math.round(params.progressPct)));
  const { error } = await supabase
    .from("enrollments")
    .update({ progress_pct: next })
    .eq("course_id", params.courseId)
    .eq("student_id", params.studentId);
  if (error) throw error;
}
