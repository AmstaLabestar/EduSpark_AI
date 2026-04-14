export type UserRole = "student" | "teacher";

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
};

