interface WellnessBadgeProps {
  score: number;
  size?: "sm" | "md";
}

function badgeColor(score: number): string {
  if (score <= 3) return "bg-red-100 text-red-700";
  if (score <= 5) return "bg-amber-100 text-amber-700";
  if (score <= 7) return "bg-emerald-100 text-emerald-700";
  return "bg-emerald-200 text-emerald-800";
}

export default function WellnessBadge({ score, size = "sm" }: WellnessBadgeProps) {
  const sizeClass = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${badgeColor(score)} ${sizeClass}`}
    >
      {score.toFixed(1)}
    </span>
  );
}
