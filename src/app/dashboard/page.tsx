import {
  Users,
  AlertTriangle,
  Heart,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import StatCard from "@/components/stat-card";
import { RiskLevelBadge, TrendBadge, AcwrValue } from "@/components/risk-badge";
import { getAllRiskSnapshotsSorted, MOCK_AS_OF } from "@/lib/data/service";

export default function DashboardPage() {
  const sorted = getAllRiskSnapshotsSorted();

  const totalPlayers = sorted.length;
  const unavailable = sorted.filter((s) => s.player.status !== "available").length;
  const atRisk = sorted.filter((s) => s.riskLevel === "high" || s.riskLevel === "critical").length;
  const withWellness = sorted.filter((s) => s.latestWellnessScore !== null);
  const avgWellness = withWellness.length > 0
    ? (withWellness.reduce((sum, s) => sum + s.latestWellnessScore!, 0) / withWellness.length).toFixed(1)
    : "—";
  const totalFlagged = sorted.filter((s) => s.sorenessFlags.length > 0).length;

  return (
    <AppShell title="Dashboard">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Good morning, Coach
        </h2>
        <p className="mt-1 text-sm text-muted">
          Squad overview as of {MOCK_AS_OF}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Players"
          value={String(totalPlayers)}
          subtitle={`${unavailable} unavailable`}
          icon={Users}
          iconBg="bg-info-light"
          iconColor="text-info"
        />
        <StatCard
          title="Players at Risk"
          value={String(atRisk)}
          subtitle="High or critical risk level"
          icon={AlertTriangle}
          iconBg="bg-danger-light"
          iconColor="text-danger"
        />
        <StatCard
          title="Avg. Wellness"
          value={avgWellness}
          subtitle="Out of 10"
          icon={Heart}
          iconBg="bg-accent-light"
          iconColor="text-accent"
        />
        <StatCard
          title="Soreness Flags"
          value={String(totalFlagged)}
          subtitle="Players with flagged muscles"
          icon={ShieldAlert}
          iconBg="bg-warning-light"
          iconColor="text-warning"
        />
      </div>

      <div className="mt-6 rounded-xl border border-card-border bg-card-bg overflow-x-auto">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-foreground">Squad Risk Overview</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border text-left">
              <th className="px-5 py-2 font-medium text-muted">Player</th>
              <th className="px-3 py-2 text-center font-medium text-muted">Risk</th>
              <th className="px-3 py-2 text-center font-medium text-muted">ACWR</th>
              <th className="px-3 py-2 text-center font-medium text-muted">Wellness</th>
              <th className="px-3 py-2 text-center font-medium text-muted">Trend</th>
              <th className="px-3 py-2 text-center font-medium text-muted">Flags</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.playerId} className="border-b border-card-border/50 last:border-0 hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <Link href={`/players/${s.playerId}`} className="font-medium text-foreground hover:text-accent transition-colors">
                    {s.player.name}
                  </Link>
                  <span className="ml-2 text-xs text-muted">{s.player.position}</span>
                </td>
                <td className="px-3 py-3 text-center"><RiskLevelBadge level={s.riskLevel} /></td>
                <td className="px-3 py-3 text-center"><AcwrValue acwr={s.acwr} /></td>
                <td className="px-3 py-3 text-center">
                  {s.latestWellnessScore !== null
                    ? <span className="text-sm font-semibold text-foreground">{s.latestWellnessScore.toFixed(1)}</span>
                    : <span className="text-xs text-muted">—</span>}
                </td>
                <td className="px-3 py-3 text-center"><TrendBadge trend={s.wellnessTrend} /></td>
                <td className="px-3 py-3 text-center">
                  {s.sorenessFlags.length > 0
                    ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">{s.sorenessFlags.length}</span>
                    : <span className="text-xs text-muted">0</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
