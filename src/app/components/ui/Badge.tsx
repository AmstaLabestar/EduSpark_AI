import React from "react";
import { cn } from "@/app/utils/cn";

type BadgeTone = "brand" | "success" | "accent" | "neutral";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const tones: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  success: "bg-success-50 text-success-700 border-success-100",
  accent: "bg-accent-50 text-accent-600 border-accent-100",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
