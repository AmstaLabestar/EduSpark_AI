import React from "react";
import { cn } from "@/app/utils/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  padded?: boolean;
};

/**
 * Soft surface card: white background, hairline border, diffuse shadow.
 * `interactive` adds a gentle lift on hover for clickable cards.
 */
export function Card({
  interactive = false,
  padded = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface border border-slate-100 shadow-soft",
        padded && "p-6",
        interactive &&
          "transition-all duration-200 ease-out hover:shadow-soft-md hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
