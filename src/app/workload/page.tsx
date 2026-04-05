import { Dumbbell, TrendingUp, Flame, Activity } from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import StatCard from "@/components/stat-card";
import { getAllSessions } from "@/lib/data/service";
import { getCurrentUser } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
import type { SessionType } from "@/lib/types";

const typeStyles: Record<SessionType, string> = {
  match:    "bg-info-light text-info",
  training: "bg-accent-light text-accent",
  gym:      "bg-warning-light text-warning",
  recovery: "bg-gray-100 text-muted",
};

function loadColor(load: number): string {
  if (load < 300) return "text-muted";
  if (load < 500) return "text-emerald-600";
  if (load < 700) return "text-orange-600 font-semibold";
  return "text-red-600 font-bold";
}

export default async function WorkloadPage() {
  const user = await getCurrentUser();
  const sessions = await getAllSessions();

  const totalSessions = sessions.length;
  const avgLoad = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.sessionLoad, 0) / totalSessions)
    : 0;
  const maxLoad = totalSessions > 0
    ? Math.max(...sessions.map((s) => s.sessionLoad))
    : 0;
  const maxSession = sessions.find((s) => s.sessionLoad === maxLoad);

  return (
    <AppShell title="Workload" userRole={user?.role} userName={user?.name}>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted">
          Recent training sessions and workload data across the squad.
        </p>
        <Link
          href="/workload/log"
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          + Log Session
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          title="Total Sessions"
          value={String(totalSessions)}
          subtitle="Last 3 days"
          icon={Dumbbell}
          iconBg="bg-accent-light"
          iconColor="text-accent"
        />
        <StatCard
          title="Avg. Session Load"
          value={`${avgLoad} AU`}
          subtitle="RPE x Duration"
          icon={TrendingUp}
          iconBg="bg-info-light"
          iconColor="text-info"
        />
        <StatCard
          title="Highest Session Load"
          value={`${maxLoad} AU`}
          subtitle={maxSession ? `${maxSession.playerName} — ${maxSession.date}` : "—"}
          icon={Flame}
          iconBg="bg-danger-light"
          iconColor="text-danger"
        />
      </div>

      {/* Sessions table */}
      <div className="rounded-xl border border-card-border bg-card-bg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border text-left">
              <th className="px-4 py-3 font-medium text-muted">Player</th>
              <th className="px-3 py-3 font-medium text-muted">Date</th>
              <th className="px-3 py-3 font-medium text-muted">Type</th>
              <th className="px-3 py-3 text-center font-medium text-muted">Duration</th>
              <th className="px-3 py-3 text-center font-medium text-muted">RPE</th>
              <th className="px-3 py-3 text-center font-medium text-muted">
                <span className="flex items-center justify-center gap-1">
                  <Activity className="h-3.5 w-3.5" />
                  Load
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr
                key={s.id}
                className="border-b border-card-border/50 last:border-0 hover:bg-gray-50/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/players/${s.playerId}`}
                    className="font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {s.playerName}
                  </Link>
                </td>
                <td className="px-3 py-3 text-xs text-muted">{s.date}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeStyles[s.type]}`}>
                    {s.type}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-foreground">{s.durationMinutes} min</td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs font-semibold ${
                    s.rpe <= 3 ? "bg-emerald-50 text-emerald-600" :
                    s.rpe <= 6 ? "bg-amber-50 text-amber-600" :
                    "bg-red-50 text-red-600"
                  }`}>
                    {s.rpe}
                  </span>
                </td>
                <td className={`px-3 py-3 text-center ${loadColor(s.sessionLoad)}`}>
                  {s.sessionLoad} AU
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
