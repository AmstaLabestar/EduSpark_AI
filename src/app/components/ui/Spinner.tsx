import { cn } from "@/app/utils/cn";

/**
 * Minimal CSS spinner. Inherits the current text color (border-current),
 * so it adapts to whatever surface it sits on.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn(
        "inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
