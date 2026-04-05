export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppShell from "@/components/app-shell";
import SessionForm from "@/components/session-form";
import { getCurrentUser, hasRole } from "@/lib/auth-utils";
import { getPlayerById } from "@/lib/data/service";
import { prisma } from "@/lib/db";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, ["admin", "coach"])) redirect("/dashboard");

  const { sessionId } = await params;

  const row = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
  if (!row) notFound();

  const player = await getPlayerById(row.playerId);
  if (!player) notFound();

  const session = {
    id: row.id,
    playerId: row.playerId,
    date: row.date,
    type: row.type as "training" | "match" | "gym" | "recovery",
    durationMinutes: row.durationMinutes,
    rpe: row.rpe,
    sessionLoad: row.sessionLoad,
    notes: row.notes ?? undefined,
  };

  return (
    <AppShell title={`Edit Session — ${player.name}`} userRole={user.role} userName={user.name}>
      <div className="mx-auto max-w-lg">
        <Link
          href="/workload"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workload
        </Link>

        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold text-foreground">Edit Session for {player.name}</h2>
          <p className="mt-1 text-sm text-muted">{session.date} &middot; {session.type}</p>
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <SessionForm
            playerId={player.id}
            playerName={player.name}
            initialSession={session}
          />
        </div>
      </div>
    </AppShell>
  );
}
