import { BookOpen, LogOut, User } from "lucide-react";
import { cn } from "@/app/utils/cn";

type AppHeaderProps = {
  subtitle: string;
  name: string;
  tone?: "brand" | "success";
  onLogout: () => void;
};

const tones = {
  brand: { logo: "bg-brand-600", chip: "bg-brand-50 text-brand-800", icon: "text-brand-700" },
  success: { logo: "bg-success-600", chip: "bg-success-50 text-success-700", icon: "text-success-700" },
};

export function AppHeader({ subtitle, name, tone = "brand", onLogout }: AppHeaderProps) {
  const t = tones[tone];
  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-xl p-2", t.logo)}>
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-lg text-ink">EduLearn BF</div>
            <div className="text-sm text-slate-500">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("hidden items-center gap-2 rounded-full px-3 py-2 sm:flex", t.chip)}>
            <User className={cn("h-5 w-5", t.icon)} />
            <span className="text-sm">{name}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
            aria-label="Se deconnecter"
          >
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
