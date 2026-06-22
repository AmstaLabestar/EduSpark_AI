import React from "react";
import { cn } from "@/app/utils/cn";
import { Spinner } from "@/app/components/ui/Spinner";

type ButtonVariant =
  | "primary"
  | "success"
  | "accent"
  | "secondary"
  | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium select-none " +
  "transition-all duration-200 ease-out active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-soft hover:shadow-brand focus-visible:ring-brand-300",
  success:
    "bg-success-600 text-white hover:bg-success-700 shadow-soft focus-visible:ring-success-200",
  accent:
    "bg-accent-400 text-ink hover:bg-accent-500 shadow-soft hover:shadow-accent focus-visible:ring-accent-200",
  secondary:
    "bg-surface text-ink border border-slate-200 hover:bg-slate-50 shadow-soft focus-visible:ring-slate-200",
  ghost:
    "bg-transparent text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-200",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-3 text-base",
  lg: "px-6 py-4 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      type,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        // Default to "button" so a stray button never submits a form by accident.
        type={type ?? "button"}
        disabled={disabled || loading}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading && <Spinner className="h-[1.1em] w-[1.1em]" />}
        {children}
      </button>
    );
  },
);
