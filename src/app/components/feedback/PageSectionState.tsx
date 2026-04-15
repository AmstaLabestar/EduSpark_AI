import { StateCard } from "@/app/components/feedback/StateCard";

type PageSectionStateProps = {
  description: string;
  title?: string;
  className?: string;
};

export function PageSectionState({
  description,
  title,
  className = "",
}: PageSectionStateProps) {
  return (
    <div className={className}>
      <StateCard title={title} description={description} />
    </div>
  );
}
