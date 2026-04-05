export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppShell from "@/components/app-shell";
import WellnessForm from "@/components/wellness-form";
import { getPlayerById, getLatestWellness } from "@/lib/data/service";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function EditCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;
  const player = await getPlayerById(id);
  if (!player) notFound();

  const latest = await getLatestWellness(player.id);
  if (!latest) notFound();

  return (
    <AppShell title={`Edit Check-in — ${player.name}`} userRole={user?.role} userName={user?.name}>
      <div className="mx-auto max-w-lg">
        <Link
          href={`/players/${player.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {player.name}
        </Link>

        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold text-foreground">
            Edit Check-in for {latest.date}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Update wellness ratings and body soreness data.
          </p>
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <WellnessForm
            playerId={player.id}
            playerName={player.name}
            initialEntry={latest}
          />
        </div>
      </div>
    </AppShell>
  );
}
