type StateCardProps = {
  title?: string;
  description: string;
  className?: string;
};

export function StateCard({
  title,
  description,
  className = "",
}: StateCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-6 text-gray-700 ${className}`.trim()}>
      {title && <p className="text-lg text-gray-900 mb-2">{title}</p>}
      <p>{description}</p>
    </div>
  );
}
