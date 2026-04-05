"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";
import PlayerPickerSession from "./player-picker-session";
import BulkSessionForm from "./bulk-session-form";
import { Dumbbell, Users } from "lucide-react";

type Mode = "single" | "bulk";

interface SessionLogSwitcherProps {
  players: Player[];
}

export default function SessionLogSwitcher({ players }: SessionLogSwitcherProps) {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <div className="mx-auto max-w-lg">
      {/* Mode toggle */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${
              mode === "single"
                ? "bg-foreground text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${
              mode === "bulk"
                ? "bg-foreground text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Bulk
          </button>
        </div>
      </div>

      {mode === "single" ? (
        <PlayerPickerSession players={players} />
      ) : (
        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <h2 className="mt-3 text-lg font-bold text-foreground">
              Bulk Log Sessions
            </h2>
            <p className="mt-1 text-sm text-muted">
              Select multiple players and log the same session for all of them.
            </p>
          </div>
          <BulkSessionForm players={players} />
        </div>
      )}
    </div>
  );
}
