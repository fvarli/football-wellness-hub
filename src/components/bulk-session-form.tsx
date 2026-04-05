"use client";

import { useState } from "react";
import type { Player, SessionType } from "@/lib/types";
import RatingInput from "./rating-input";
import { CheckCircle, Loader2, AlertCircle, Users } from "lucide-react";

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "training", label: "Training" },
  { value: "match", label: "Match" },
  { value: "gym", label: "Gym" },
  { value: "recovery", label: "Recovery" },
];

const MAX_VISIBLE_NAMES = 5;

interface BulkSessionFormProps {
  players: Player[];
}

export default function BulkSessionForm({ players }: BulkSessionFormProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<SessionType>("training");
  const [duration, setDuration] = useState("");
  const [rpe, setRpe] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [createdNames, setCreatedNames] = useState<string[]>([]);
  const [createdLoad, setCreatedLoad] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const canSubmit = selectedIds.size > 0 && date.length > 0 && duration.length > 0 && rpe !== null && !submitting;

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === players.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(players.map((p) => p.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setErrors([]);
    setSubmitting(true);

    try {
      const res = await fetch("/api/sessions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerIds: [...selectedIds],
          date,
          type,
          durationMinutes: parseInt(duration, 10),
          rpe,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const apiErrors: string[] = Array.isArray(data.errors)
          ? data.errors.map((err: { message?: string }) => err.message ?? String(err))
          : ["Submission failed"];
        setErrors(apiErrors);
        setSubmitting(false);
        return;
      }

      const names = [...selectedIds].map((id) => players.find((p) => p.id === id)?.name ?? id);
      setCreatedCount(data.sessions.length);
      setCreatedNames(names);
      setCreatedLoad(data.sessions[0]?.sessionLoad ?? 0);
      setSubmitted(true);
    } catch {
      setErrors(["Network error — please try again"]);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedIds(new Set());
    setDate(new Date().toISOString().slice(0, 10));
    setType("training");
    setDuration("");
    setRpe(null);
    setNotes("");
    setSubmitted(false);
    setErrors([]);
    setCreatedCount(0);
    setCreatedNames([]);
    setCreatedLoad(0);
  }

  if (submitted) {
    const visibleNames = createdNames.slice(0, MAX_VISIBLE_NAMES);
    const remaining = createdNames.length - visibleNames.length;

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="h-16 w-16 text-accent" />
        <h3 className="mt-4 text-xl font-bold text-foreground">
          {createdCount} {createdCount === 1 ? "Session" : "Sessions"} Logged
        </h3>
        <p className="mt-2 text-sm text-muted">
          Load per player: <span className="font-semibold text-foreground">{createdLoad} AU</span>
        </p>
        <div className="mt-3 text-sm text-muted">
          {visibleNames.join(", ")}
          {remaining > 0 && <span className="text-muted"> +{remaining} more</span>}
        </div>
        <div className="mt-6">
          <button type="button" onClick={resetForm} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors">
            Log More
          </button>
        </div>
      </div>
    );
  }

  const dur = parseInt(duration, 10);
  const loadPerPlayer = rpe !== null && dur > 0 ? rpe * dur : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger-light p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-medium text-danger">Submission failed</p>
              <ul className="mt-1 list-inside list-disc text-xs text-danger/80">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Player selection */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Players <span className="font-normal text-muted">({selectedIds.size} of {players.length})</span>
          </label>
          <button type="button" onClick={toggleAll} className="text-xs font-medium text-accent hover:underline">
            {selectedIds.size === players.length ? "Deselect All" : "Select All"}
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto rounded-lg border border-card-border bg-white p-2">
          {players.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedIds.has(p.id)}
                onChange={() => togglePlayer(p.id)}
                className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-foreground">{p.name}</span>
              <span className="text-muted">— #{p.number} ({p.position})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Shared fields — same as SessionForm */}
      <div>
        <label htmlFor="bulk-date" className="mb-2 block text-sm font-medium text-foreground">Date</label>
        <input id="bulk-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Session Type</p>
        <div className="flex gap-2">
          {SESSION_TYPES.map((st) => (
            <button key={st.value} type="button" onClick={() => setType(st.value)} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${type === st.value ? "bg-foreground text-white" : "bg-gray-100 text-muted hover:bg-gray-200"}`}>
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="bulk-duration" className="mb-2 block text-sm font-medium text-foreground">Duration (minutes)</label>
        <input id="bulk-duration" type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 75" className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </div>

      <RatingInput label="RPE (Rate of Perceived Exertion)" lowLabel="Very easy" highLabel="Maximum effort" value={rpe} onChange={setRpe} />

      <div>
        <label htmlFor="bulk-notes" className="mb-2 block text-sm font-medium text-foreground">Notes <span className="font-normal text-muted">(optional)</span></label>
        <textarea id="bulk-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. tactical drills, match minutes, gym focus..." className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </div>

      {loadPerPlayer !== null && (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-center">
          <p className="text-xs text-muted">Estimated Session Load</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {loadPerPlayer} <span className="text-sm font-normal text-muted">AU per player</span>
            {selectedIds.size > 1 && (
              <span className="text-sm font-normal text-muted"> · {loadPerPlayer * selectedIds.size} AU total</span>
            )}
          </p>
        </div>
      )}

      <button type="submit" disabled={!canSubmit} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
        ) : (
          <><Users className="h-4 w-4" />Log {selectedIds.size} {selectedIds.size === 1 ? "Session" : "Sessions"}</>
        )}
      </button>
    </form>
  );
}
