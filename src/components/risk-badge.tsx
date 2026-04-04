import type { RiskLevel, TrendDirection } from "@/lib/types";

const riskStyles: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

const trendIcons: Record<TrendDirection, string> = {
  improving: "\u2191",
  stable: "\u2192",
  declining: "\u2193",
};

const trendStyles: Record<TrendDirection, string> = {
  improving: "text-emerald-600",
  stable: "text-muted",
  declining: "text-red-600",
};

export function RiskLevelBadge({ level, size = "sm" }: { level: RiskLevel; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${riskStyles[level]} ${sizeClass}`}>
      {riskLabels[level]}
    </span>
  );
}

export function TrendBadge({ trend }: { trend: TrendDirection }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trendStyles[trend]}`}>
      {trendIcons[trend]} {trend}
    </span>
  );
}

export function AcwrValue({ acwr }: { acwr: number | null }) {
  if (acwr === null) return <span className="text-xs text-muted">N/A</span>;
  let color = "text-emerald-600";
  if (acwr < 0.8 || acwr > 1.3) color = "text-amber-600";
  if (acwr > 1.5) color = "text-red-600";
  return <span className={`text-sm font-bold ${color}`}>{acwr.toFixed(2)}</span>;
}
