import AppShell from "@/components/app-shell";
import SessionForm from "@/components/session-form";
import { Dumbbell } from "lucide-react";

// Hardcoded demo player until auth is implemented.
const DEMO_PLAYER_ID = "1";

export default function LogSessionPage() {
  return (
    <AppShell title="Log Session">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
            <Dumbbell className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">
            Log a Training Session
          </h2>
          <p className="mt-1 text-sm text-muted">
            Record session type, duration, and perceived exertion.
          </p>
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <SessionForm playerId={DEMO_PLAYER_ID} />
        </div>
      </div>
    </AppShell>
  );
}
