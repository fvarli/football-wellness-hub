export const dynamic = "force-dynamic";

import AppShell from "@/components/app-shell";
import PlayersList from "@/components/players-list";
import { getAllPlayers, getLatestWellness, getAllRiskSnapshots } from "@/lib/data/service";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function PlayersPage() {
  const user = await getCurrentUser();
  const players = await getAllPlayers();
  const snapshots = await getAllRiskSnapshots();
  const snapshotMap = new Map(snapshots.map((s) => [s.playerId, s]));

  const playersData = await Promise.all(
    players.map(async (player) => ({
      player,
      latestWellness: (await getLatestWellness(player.id)) ?? null,
      riskSnapshot: snapshotMap.get(player.id) ?? null,
    })),
  );

  return (
    <AppShell title="Players" userRole={user?.role} userName={user?.name}>
      <PlayersList playersData={playersData} />
    </AppShell>
  );
}
