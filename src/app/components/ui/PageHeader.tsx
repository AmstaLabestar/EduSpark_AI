import React from "react";
import { ArrowLeft } from "lucide-react";

type PageHeaderProps = {
  onBack: () => void;
  backLabel?: string;
  children?: React.ReactNode;
};

/** Sticky page header with a back action and an optional title row. */
export function PageHeader({
  onBack,
  backLabel = "Retour",
  children,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-2 text-brand-600 transition-colors hover:text-brand-700"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-lg">{backLabel}</span>
        </button>
        {children}
      </div>
    </header>
  );
}
