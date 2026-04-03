"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import AppShell from "@/components/app-shell";
import WellnessBadge from "@/components/wellness-badge";
import { players, getLatestWellness } from "@/lib/mock-data";

const statusStyles: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  injured: "bg-red-100 text-red-700",
  resting: "bg-amber-100 text-amber-700",
};

export default function PlayersPage() {
  const [search, setSearch] = useState("");

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell title="Players">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{players.length} players in squad</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((player) => {
          const latest = getLatestWellness(player.id);
          return (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="group rounded-xl border border-card-border bg-card-bg p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                  {player.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                      {player.name}
                    </p>
                    <span className="shrink-0 text-xs font-medium text-muted">#{player.number}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-muted">{player.position}</span>
                    <span className="text-xs text-muted">&middot;</span>
                    <span className="text-xs text-muted">Age {player.age}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[player.status]}`}
                >
                  {player.status}
                </span>
                {latest ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted">Wellness</span>
                    <WellnessBadge score={latest.overallScore} />
                  </div>
                ) : (
                  <span className="text-xs text-muted">No data</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted">No players match your search.</p>
        </div>
      )}
    </AppShell>
  );
}
