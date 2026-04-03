import Link from "next/link";
import AppShell from "@/components/app-shell";
import WellnessBadge from "@/components/wellness-badge";
import { getAllLatestWellness } from "@/lib/mock-data";
import { WELLNESS_METRICS } from "@/lib/types";

const statusStyles: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  injured: "bg-red-100 text-red-700",
  resting: "bg-amber-100 text-amber-700",
};

function cellColor(value: number): string {
  if (value <= 3) return "text-red-600 bg-red-50";
  if (value <= 5) return "text-amber-600 bg-amber-50";
  if (value <= 7) return "text-emerald-600 bg-emerald-50";
  return "text-emerald-700 bg-emerald-100";
}

export default function WellnessOverviewPage() {
  const data = getAllLatestWellness();

  return (
    <AppShell title="Wellness Overview">
      <div className="mb-5">
        <p className="text-sm text-muted">
          Latest wellness scores for all players. Color-coded for quick scanning.
        </p>
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border text-left">
              <th className="px-4 py-3 font-medium text-muted">Player</th>
              <th className="px-3 py-3 font-medium text-muted">Status</th>
              <th className="px-3 py-3 font-medium text-muted">Date</th>
              {WELLNESS_METRICS.map((m) => (
                <th key={m.key} className="px-2 py-3 text-center font-medium text-muted">
                  {m.label.length > 8 ? m.label.split(" ")[0] : m.label}
                </th>
              ))}
              <th className="px-3 py-3 text-center font-medium text-muted">Overall</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ player, ...entry }) => (
              <tr
                key={entry.id}
                className="border-b border-card-border/50 last:border-0 hover:bg-gray-50/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/players/${player.id}`}
                    className="font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {player.name}
                  </Link>
                  <span className="ml-2 text-xs text-muted">{player.position}</span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[player.status]}`}
                  >
                    {player.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-muted">{entry.date}</td>
                {WELLNESS_METRICS.map((m) => (
                  <td key={m.key} className="px-2 py-3 text-center">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs font-semibold ${cellColor(entry[m.key])}`}>
                      {entry[m.key]}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-3 text-center">
                  <WellnessBadge score={entry.overallScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
