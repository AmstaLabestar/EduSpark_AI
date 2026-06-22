import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/app/utils/cn";

type NoticeTone = "error" | "success" | "info" | "warning";

const toneStyles: Record<NoticeTone, string> = {
  error: "border-red-100 bg-red-50 text-red-900",
  success: "border-success-100 bg-success-50 text-success-700",
  info: "border-brand-100 bg-brand-50 text-brand-800",
  warning: "border-accent-100 bg-accent-50 text-accent-600",
};

const toneIcon: Record<NoticeTone, typeof Info> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
};

type NoticeProps = {
  message: string;
  tone?: NoticeTone;
  className?: string;
};

export function Notice({ message, tone = "info", className = "" }: NoticeProps) {
  const Icon = toneIcon[tone];
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 shadow-soft",
        "animate-in fade-in slide-in-from-top-1 duration-300",
        toneStyles[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}
