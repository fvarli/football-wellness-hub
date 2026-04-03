import AppShell from "@/components/app-shell";
import WellnessForm from "@/components/wellness-form";
import { ClipboardCheck } from "lucide-react";

export default function CheckInPage() {
  return (
    <AppShell title="Daily Check-in">
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
          <WellnessForm />
        </div>
      </div>
    </AppShell>
  );
}
