type NoticeTone = "error" | "success" | "info" | "warning";

const toneStyles: Record<NoticeTone, string> = {
  error: "border-red-300 bg-red-50 text-gray-900",
  success: "border-green-200 bg-green-50 text-gray-900",
  info: "border-blue-200 bg-blue-50 text-gray-900",
  warning: "border-yellow-300 bg-yellow-50 text-gray-900",
};

type NoticeProps = {
  message: string;
  tone?: NoticeTone;
  className?: string;
};

export function Notice({
  message,
  tone = "info",
  className = "",
}: NoticeProps) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${toneStyles[tone]} ${className}`.trim()}>
      {message}
    </div>
  );
}
