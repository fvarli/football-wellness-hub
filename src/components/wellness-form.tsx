"use client";

import { useState } from "react";
import { WELLNESS_METRICS, type WellnessMetric, type BodyMapSelection } from "@/lib/types";
import RatingInput from "./rating-input";
import BodyMap from "./body-map";
import { CheckCircle, ChevronDown, ChevronUp, Loader2, AlertCircle } from "lucide-react";

interface WellnessFormProps {
  playerId: string;
  playerName?: string;
}

export default function WellnessForm({ playerId, playerName }: WellnessFormProps) {
  const [ratings, setRatings] = useState<Partial<Record<WellnessMetric, number>>>({});
  const [notes, setNotes] = useState("");
  const [bodySelections, setBodySelections] = useState<BodyMapSelection[]>([]);
  const [bodyMapOpen, setBodyMapOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [bodyMapCount, setBodyMapCount] = useState(0);

  const allFilled = WELLNESS_METRICS.every((m) => ratings[m.key] != null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled || submitting) return;

    setErrors([]);
    setSubmitting(true);

    const payload = {
      playerId,
      date: new Date().toISOString().slice(0, 10),
      ...(ratings as Record<WellnessMetric, number>),
      notes: notes || undefined,
      bodyMap: bodySelections.map((s) => ({
        regionKey: s.regionKey,
        severity: s.severity,
        view: s.view,
        side: s.side,
      })),
    };

    try {
      const res = await fetch("/api/wellness/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const apiErrors: string[] = Array.isArray(data.errors)
          ? data.errors.map((e: { message?: string }) => e.message ?? String(e))
          : ["Submission failed"];
        setErrors(apiErrors);
        setSubmitting(false);
        return;
      }

      setBodyMapCount(data.bodyMap?.length ?? 0);
      setSubmitted(true);
    } catch {
      setErrors(["Network error — please try again"]);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setRatings({});
    setNotes("");
    setBodySelections([]);
    setBodyMapOpen(false);
    setSubmitted(false);
    setErrors([]);
    setBodyMapCount(0);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="h-16 w-16 text-accent" />
        <h3 className="mt-4 text-xl font-bold text-foreground">Check-in Complete</h3>
        <p className="mt-2 text-sm text-muted">
          {playerName ? `${playerName}'s` : "Your"} wellness data has been recorded.
        </p>
        {bodyMapCount > 0 && (
          <p className="mt-1 text-xs text-muted">
            {bodyMapCount} body area{bodyMapCount > 1 ? "s" : ""} marked.
          </p>
        )}
        <button
          type="button"
          onClick={resetForm}
          className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
        >
          Submit Another
        </button>
      </div>
    );
  }

  const filledCount = WELLNESS_METRICS.filter((m) => ratings[m.key] != null).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error summary */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger-light p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-medium text-danger">Submission failed</p>
              <ul className="mt-1 list-inside list-disc text-xs text-danger/80">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-accent transition-all duration-300"
            style={{ width: `${(filledCount / WELLNESS_METRICS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted">
          {filledCount}/{WELLNESS_METRICS.length}
        </span>
      </div>

      {WELLNESS_METRICS.map((metric) => (
        <RatingInput
          key={metric.key}
          label={metric.label}
          lowLabel={metric.lowLabel}
          highLabel={metric.highLabel}
          value={ratings[metric.key] ?? null}
          onChange={(val) => setRatings((prev) => ({ ...prev, [metric.key]: val }))}
        />
      ))}

      {/* Body Soreness Map — collapsible */}
      <div className="rounded-lg border border-card-border">
        <button
          type="button"
          onClick={() => setBodyMapOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              Body Soreness Map
              {bodySelections.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                  {bodySelections.length}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {bodySelections.length > 0
                ? `${bodySelections.length} area${bodySelections.length > 1 ? "s" : ""} marked`
                : "Tap to mark sore muscle groups (optional)"}
            </p>
          </div>
          {bodyMapOpen ? (
            <ChevronUp className="h-4 w-4 text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted" />
          )}
        </button>
        {bodyMapOpen && (
          <div className="border-t border-card-border px-4 py-4">
            <BodyMap selections={bodySelections} onChange={setBodySelections} />
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="wellness-notes" className="mb-2 block text-sm font-medium text-foreground">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="wellness-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything to flag? e.g. tight hamstring, poor sleep, personal stress..."
          className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <button
        type="submit"
        disabled={!allFilled || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Check-in"
        )}
      </button>
    </form>
  );
}
