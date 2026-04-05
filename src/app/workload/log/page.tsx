export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import SessionForm from "@/components/session-form";
import { Dumbbell } from "lucide-react";
import { getCurrentUser, hasRole } from "@/lib/auth-utils";

export default async function LogSessionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!hasRole(user, ["admin", "coach"])) {
    return (
      <AppShell title="Log Session">
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-sm text-muted">
            Only coaches and admins can log training sessions.
          </p>
        </div>
      </AppShell>
    );
  }

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
          <SessionForm />
        </div>
      </div>
    </AppShell>
  );
}
