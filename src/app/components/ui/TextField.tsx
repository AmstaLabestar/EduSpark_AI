import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/utils/cn";

const fieldBase =
  "w-full rounded-xl border border-slate-200 bg-white text-base text-ink " +
  "placeholder:text-slate-400 shadow-soft outline-none transition-all duration-200 " +
  "focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

let autoId = 0;
function useFieldId(provided?: string) {
  const [generated] = React.useState(() => `field-${++autoId}`);
  return provided ?? generated;
}

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: LucideIcon;
};

export function TextField({
  label,
  icon: Icon,
  id,
  className,
  ...props
}: TextFieldProps) {
  const fieldId = useFieldId(id);
  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-ink-soft">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        )}
        <input
          id={fieldId}
          className={cn(fieldBase, "px-4 py-3.5", Icon && "pl-12", className)}
          {...props}
        />
      </div>
    </div>
  );
}

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function TextArea({
  label,
  hint,
  id,
  className,
  ...props
}: TextAreaProps) {
  const fieldId = useFieldId(id);
  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-ink-soft">
        {label}
      </label>
      <textarea
        id={fieldId}
        className={cn(fieldBase, "px-4 py-3.5 resize-y leading-relaxed", className)}
        {...props}
      />
      {hint && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}
