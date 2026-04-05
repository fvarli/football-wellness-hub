export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import WellnessForm from "@/components/wellness-form";
import PlayerPickerCheckIn from "@/components/player-picker-checkin";
import { ClipboardCheck } from "lucide-react";
import { getCurrentUser, hasRole } from "@/lib/auth-utils";
import { getAllPlayers } from "@/lib/data/service";

export default async function CheckInPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Coach/admin: show player picker
  if (hasRole(user, ["admin", "coach"])) {
    const players = await getAllPlayers();
    return (
      <AppShell title="Submit Check-in" userRole={user.role} userName={user.name}>
        <PlayerPickerCheckIn players={players} userRole={user.role} userName={user.name} />
      </AppShell>
    );
  }

  // Player: submit for themselves
  const playerId = user.playerId;
  if (!playerId) {
    return (
      <AppShell title="Daily Check-in" userRole={user.role} userName={user.name}>
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-sm text-muted">
            Your account is not linked to a player profile. Contact an administrator.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Daily Check-in" userRole={user.role} userName={user.name}>
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
            <ClipboardCheck className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">
            How are you feeling today?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Rate each area from 1 (worst) to 10 (best). This takes under a minute.
          </p>
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <WellnessForm playerId={playerId} playerName={user.name} />
        </div>
      </div>
    </AppShell>
  );
}
