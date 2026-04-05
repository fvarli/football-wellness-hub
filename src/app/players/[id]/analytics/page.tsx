export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";
import AppShell from "@/components/app-shell";
import AnalyticsChart from "@/components/analytics-chart";
import type { DataPoint } from "@/components/analytics-chart";
import { getPlayerById, getWellnessForPlayer, getSessionsForPlayer, getRiskSnapshot } from "@/lib/data/service";
import { getCurrentUser } from "@/lib/auth-utils";
import { generatePlayerInsights } from "@/lib/insights";

export default async function PlayerAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;
  const player = await getPlayerById(id);

  if (!player) notFound();

  const entries = await getWellnessForPlayer(player.id);
  const sessions = await getSessionsForPlayer(player.id);
  const snap = await getRiskSnapshot(player.id);
  const insights = generatePlayerInsights(snap, entries, sessions);

  // Build chart data (oldest first)
  const wellnessPoints: DataPoint[] = entries
    .slice()
    .reverse()
    .map((e) => ({ date: e.date, value: e.overallScore }));

  const loadPoints: DataPoint[] = sessions
    .slice()
    .reverse()
    .map((s) => ({ date: s.date, value: s.sessionLoad }));

  return (
    <AppShell title={`Analytics — ${player.name}`} userRole={user?.role} userName={user?.name}>
      <Link
        href={`/players/${player.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {player.name}
      </Link>

      {/* Insight summary */}
      {insights.length > 0 && (
        <div className="mb-6 rounded-xl border border-card-border bg-card-bg p-5">
          <div className="mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-muted" />
            <h3 className="text-sm font-semibold text-foreground">What stands out</h3>
          </div>
          <div className="space-y-1.5">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-md px-3 py-1.5 text-xs ${
                  insight.type === "warning"
                    ? "bg-orange-50 text-orange-800"
                    : insight.type === "positive"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-gray-50 text-muted"
                }`}
              >
                <span className="mt-0.5 shrink-0 font-bold">
                  {insight.type === "warning" ? "!" : insight.type === "positive" ? "+" : "\u2013"}
                </span>
                <span>{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="space-y-6">
        <AnalyticsChart
          title="Wellness Score"
          points={wellnessPoints}
          color="#10b981"
          defaultRange={14}
        />

        <AnalyticsChart
          title="Session Load"
          points={loadPoints}
          color="#f59e0b"
          unit="AU"
          defaultRange={14}
        />
      </div>
    </AppShell>
  );
}
