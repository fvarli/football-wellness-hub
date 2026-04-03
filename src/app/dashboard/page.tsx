import {
  Users,
  AlertTriangle,
  Heart,
  Activity,
  TrendingUp,
  Calendar,
} from "lucide-react";
import AppShell from "@/components/app-shell";
import StatCard from "@/components/stat-card";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      {/* Welcome section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Good morning, Coach
        </h2>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s your squad overview for today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Players"
          value="24"
          subtitle="3 unavailable"
          icon={Users}
          iconBg="bg-info-light"
          iconColor="text-info"
        />
        <StatCard
          title="Players at Risk"
          value="5"
          subtitle="High workload + low wellness"
          icon={AlertTriangle}
          iconBg="bg-danger-light"
          iconColor="text-danger"
          trend={{ value: "2 more than last week", positive: false }}
        />
        <StatCard
          title="Avg. Wellness"
          value="7.2"
          subtitle="Out of 10"
          icon={Heart}
          iconBg="bg-accent-light"
          iconColor="text-accent"
          trend={{ value: "0.4 from yesterday", positive: true }}
        />
        <StatCard
          title="Weekly Load"
          value="1,840"
          subtitle="AU (arbitrary units)"
          icon={Activity}
          iconBg="bg-warning-light"
          iconColor="text-warning"
          trend={{ value: "5% from last week", positive: true }}
        />
      </div>

      {/* Placeholder sections */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Wellness */}
        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Recent Wellness Entries
            </h3>
            <TrendingUp className="h-4 w-4 text-muted" />
          </div>
          <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
            <Heart className="h-10 w-10 text-card-border" />
            <p className="mt-3 text-sm font-medium text-muted">
              No wellness data yet
            </p>
            <p className="mt-1 text-xs text-muted">
              Entries will appear here once players submit daily check-ins.
            </p>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Upcoming Sessions
            </h3>
            <Calendar className="h-4 w-4 text-muted" />
          </div>
          <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-10 w-10 text-card-border" />
            <p className="mt-3 text-sm font-medium text-muted">
              No sessions scheduled
            </p>
            <p className="mt-1 text-xs text-muted">
              Training sessions and match data will show up here.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
