import type { BodyMapSelection } from "@/lib/types";

function severityColor(severity: number): string {
  if (severity <= 3) return "bg-yellow-100 text-yellow-800";
  if (severity <= 6) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function severityLabel(severity: number): string {
  if (severity <= 3) return "Mild";
  if (severity <= 6) return "Moderate";
  return "Severe";
}

interface BodyMapSummaryProps {
  selections: BodyMapSelection[];
}

export default function BodyMapSummary({ selections }: BodyMapSummaryProps) {
  if (selections.length === 0) return null;

  const sorted = [...selections].sort((a, b) => b.severity - a.severity);

  return (
    <div className="space-y-2">
      {sorted.map((s) => (
        <div
          key={s.regionKey}
          className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs capitalize text-muted">{s.view}</span>
            <span className="text-sm font-medium text-foreground">{s.label}</span>
            {s.side && s.side !== "center" && (
              <span className="text-xs text-muted capitalize">({s.side})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severityColor(s.severity)}`}>
              {s.severity}/10
            </span>
            <span className="text-xs text-muted">{severityLabel(s.severity)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
