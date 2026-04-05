export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import PlayerPickerSession from "@/components/player-picker-session";
import { getCurrentUser, hasRole } from "@/lib/auth-utils";
import { getAllPlayers } from "@/lib/data/service";

export default async function LogSessionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!hasRole(user, ["admin", "coach"])) {
    return (
      <AppShell title="Log Session" userRole={user.role} userName={user.name}>
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-sm text-muted">
            Only coaches and admins can log training sessions.
          </p>
        </div>
      </AppShell>
    );
  }

  const players = await getAllPlayers();

  return (
    <AppShell title="Log Session" userRole={user.role} userName={user.name}>
      <PlayerPickerSession players={players} />
    </AppShell>
  );
}
