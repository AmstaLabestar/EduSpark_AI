import { cn } from "@/app/utils/cn";

type ProgressTone = "brand" | "success" | "accent";

type ProgressBarProps = {
  value: number;
  tone?: ProgressTone;
  className?: string;
};

const tones: Record<ProgressTone, string> = {
  brand: "bg-brand-600",
  success: "bg-success-600",
  accent: "bg-accent-400",
};

/**
 * Slim rounded progress track. The fill width is necessarily dynamic, so it is
 * driven by an inline style (the one place an inline style is unavoidable).
 */
export function ProgressBar({
  value,
  tone = "brand",
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          tones[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
