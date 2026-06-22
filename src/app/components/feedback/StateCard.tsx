import { cn } from "@/app/utils/cn";
import { Spinner } from "@/app/components/ui/Spinner";

type StateCardProps = {
  title?: string;
  description: string;
  loading?: boolean;
  className?: string;
};

export function StateCard({
  title,
  description,
  loading = false,
  className = "",
}: StateCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface border border-slate-100 shadow-soft p-6 text-ink-soft",
        "animate-in fade-in duration-300",
        className,
      )}
    >
      {title && <p className="mb-2 text-lg text-ink">{title}</p>}
      <div className="flex items-center gap-3">
        {loading && <Spinner className="h-5 w-5 text-brand-500" />}
        <p>{description}</p>
      </div>
    </div>
  );
}
