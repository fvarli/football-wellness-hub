import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppShell from "@/components/app-shell";
import WellnessBadge from "@/components/wellness-badge";
import BodyMapSummary from "@/components/body-map-summary";
import { getPlayer, getPlayerWellness, getLatestWellness, getBodyMapForEntry } from "@/lib/mock-data";
import { WELLNESS_METRICS } from "@/lib/types";

const statusStyles: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  injured: "bg-red-100 text-red-700",
  resting: "bg-amber-100 text-amber-700",
};

function metricColor(value: number): string {
  if (value <= 3) return "text-red-600";
  if (value <= 5) return "text-amber-600";
  if (value <= 7) return "text-emerald-600";
  return "text-emerald-700 font-semibold";
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = getPlayer(id);

  if (!player) notFound();

  const entries = getPlayerWellness(player.id);
  const latest = getLatestWellness(player.id);
  const latestBodyMap = latest ? getBodyMapForEntry(latest.id) : [];

  return (
    <AppShell title={player.name}>
      {/* Back link */}
      <Link
        href="/players"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Players
      </Link>

      {/* Player header */}
      <div className="rounded-xl border border-card-border bg-card-bg p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
            {player.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">{player.name}</h2>
              <span className="text-sm text-muted">#{player.number}</span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-sm text-muted">{player.position}</span>
              <span className="text-sm text-muted">&middot;</span>
              <span className="text-sm text-muted">Age {player.age}</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[player.status]}`}
              >
                {player.status}
              </span>
            </div>
          </div>
          {latest && (
            <div className="ml-auto text-right">
              <p className="text-xs text-muted">Overall</p>
              <WellnessBadge score={latest.overallScore} size="md" />
            </div>
          )}
        </div>
      </div>

      {/* Latest scores breakdown */}
      {latest && (
        <div className="mt-4 rounded-xl border border-card-border bg-card-bg p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Latest Check-in &mdash; {latest.date}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {WELLNESS_METRICS.map((metric) => (
              <div key={metric.key} className="text-center">
                <p className="text-xs text-muted">{metric.label}</p>
                <p className={`mt-1 text-xl font-bold ${metricColor(latest[metric.key])}`}>
                  {latest[metric.key]}
                </p>
              </div>
            ))}
          </div>
          {latest.notes && (
            <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs font-medium text-muted">Notes</p>
              <p className="mt-0.5 text-sm text-foreground">{latest.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Body soreness summary */}
      {latestBodyMap.length > 0 && (
        <div className="mt-4 rounded-xl border border-card-border bg-card-bg p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Body Soreness &mdash; {latest?.date}
          </h3>
          <BodyMapSummary selections={latestBodyMap} />
        </div>
      )}

      {/* Wellness history */}
      <div className="mt-4 rounded-xl border border-card-border bg-card-bg p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Wellness History
        </h3>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            No wellness entries recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left">
                  <th className="pb-2 pr-4 font-medium text-muted">Date</th>
                  {WELLNESS_METRICS.map((m) => (
                    <th key={m.key} className="pb-2 pr-4 text-center font-medium text-muted">
                      {m.label.split(" ")[0]}
                    </th>
                  ))}
                  <th className="pb-2 text-center font-medium text-muted">Overall</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-card-border/50 last:border-0">
                    <td className="py-2.5 pr-4 text-foreground">{entry.date}</td>
                    {WELLNESS_METRICS.map((m) => (
                      <td key={m.key} className={`py-2.5 pr-4 text-center ${metricColor(entry[m.key])}`}>
                        {entry[m.key]}
                      </td>
                    ))}
                    <td className="py-2.5 text-center">
                      <WellnessBadge score={entry.overallScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
