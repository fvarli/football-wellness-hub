"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";
import SessionForm from "./session-form";
import { Dumbbell } from "lucide-react";

interface PlayerPickerSessionProps {
  players: Player[];
}

export default function PlayerPickerSession({ players }: PlayerPickerSessionProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
          <Dumbbell className="h-6 w-6 text-accent" />
        </div>
        <h2 className="mt-3 text-lg font-bold text-foreground">
          Log a Training Session
        </h2>
        <p className="mt-1 text-sm text-muted">
          Select a player and record their session data.
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="session-player-select" className="mb-2 block text-sm font-medium text-foreground">
          Player
        </label>
        <select
          id="session-player-select"
          value={selectedPlayerId}
          onChange={(e) => setSelectedPlayerId(e.target.value)}
          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Select a player...</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — #{p.number} ({p.position})
            </option>
          ))}
        </select>
      </div>

      {selectedPlayer && (
        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <SessionForm
            key={selectedPlayerId}
            playerId={selectedPlayerId}
            playerName={selectedPlayer.name}
          />
        </div>
      )}
    </div>
  );
}
