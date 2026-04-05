"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionType, TrainingSession } from "@/lib/types";
import RatingInput from "./rating-input";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "training", label: "Training" },
  { value: "match", label: "Match" },
  { value: "gym", label: "Gym" },
  { value: "recovery", label: "Recovery" },
];

interface SessionFormProps {
  playerId: string;
  playerName?: string;
  initialSession?: TrainingSession;
}

export default function SessionForm({ playerId, playerName, initialSession }: SessionFormProps) {
  const router = useRouter();
  const isEdit = !!initialSession;

  const [date, setDate] = useState(initialSession?.date ?? new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<SessionType>(initialSession?.type ?? "training");
  const [duration, setDuration] = useState(initialSession ? String(initialSession.durationMinutes) : "");
  const [rpe, setRpe] = useState<number | null>(initialSession?.rpe ?? null);
  const [notes, setNotes] = useState(initialSession?.notes ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdLoad, setCreatedLoad] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const canSubmit = date.length > 0 && duration.length > 0 && rpe !== null && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setErrors([]);
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      playerId,
      date,
      type,
      durationMinutes: parseInt(duration, 10),
      rpe,
      notes: notes || undefined,
    };
    if (isEdit) payload.sessionId = initialSession.id;

    try {
      const res = await fetch("/api/sessions", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      setCreatedLoad(data.sessionLoad ?? 0);
      setSubmitted(true);
    } catch {
      setErrors(["Network error — please try again"]);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setDate(new Date().toISOString().slice(0, 10));
    setType("training");
    setDuration("");
    setRpe(null);
    setNotes("");
    setSubmitted(false);
    setErrors([]);
    setCreatedLoad(0);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="h-16 w-16 text-accent" />
        <h3 className="mt-4 text-xl font-bold text-foreground">
          {isEdit ? "Session Updated" : "Session Logged"}
        </h3>
        <p className="mt-2 text-sm text-muted">
          {playerName ? `${playerName}'s session` : "Session"} — load: <span className="font-semibold text-foreground">{createdLoad} AU</span>
        </p>
        <div className="mt-6 flex gap-3">
          {isEdit ? (
            <button type="button" onClick={() => router.back()} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors">
              Back
            </button>
          ) : (
            <button type="button" onClick={resetForm} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors">
              Log Another
            </button>
          )}
        </div>
      </div>
    );
  }

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

      <div>
        <label htmlFor="session-date" className="mb-2 block text-sm font-medium text-foreground">Date</label>
        <input id="session-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
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
        <label htmlFor="session-duration" className="mb-2 block text-sm font-medium text-foreground">Duration (minutes)</label>
        <input id="session-duration" type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 75" className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </div>

      <RatingInput label="RPE (Rate of Perceived Exertion)" lowLabel="Very easy" highLabel="Maximum effort" value={rpe} onChange={setRpe} />

      <div>
        <label htmlFor="session-notes" className="mb-2 block text-sm font-medium text-foreground">Notes <span className="font-normal text-muted">(optional)</span></label>
        <textarea id="session-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. tactical drills, match minutes, gym focus..." className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </div>

      {rpe !== null && duration.length > 0 && parseInt(duration, 10) > 0 && (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-center">
          <p className="text-xs text-muted">Estimated Session Load</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{rpe * parseInt(duration, 10)} <span className="text-sm font-normal text-muted">AU</span></p>
        </div>
      )}

      <button type="submit" disabled={!canSubmit} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">
        {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" />{isEdit ? "Updating..." : "Submitting..."}</>) : (isEdit ? "Update Session" : "Log Session")}
      </button>
    </form>
  );
}
