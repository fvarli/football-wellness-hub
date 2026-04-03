"use client";

import { useState } from "react";
import { WELLNESS_METRICS, type WellnessMetric, type BodyMapSelection } from "@/lib/types";
import RatingInput from "./rating-input";
import BodyMap from "./body-map";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

interface WellnessFormData {
  ratings: Record<WellnessMetric, number>;
  notes: string;
  bodyMap: BodyMapSelection[];
}

interface WellnessFormProps {
  playerName?: string;
  onSubmit?: (data: WellnessFormData) => void;
}

export default function WellnessForm({ playerName, onSubmit }: WellnessFormProps) {
  const [ratings, setRatings] = useState<Partial<Record<WellnessMetric, number>>>({});
  const [notes, setNotes] = useState("");
  const [bodySelections, setBodySelections] = useState<BodyMapSelection[]>([]);
  const [bodyMapOpen, setBodyMapOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allFilled = WELLNESS_METRICS.every((m) => ratings[m.key] != null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled) return;
    onSubmit?.({
      ratings: ratings as Record<WellnessMetric, number>,
      notes,
      bodyMap: bodySelections,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="h-16 w-16 text-accent" />
        <h3 className="mt-4 text-xl font-bold text-foreground">Check-in Complete</h3>
        <p className="mt-2 text-sm text-muted">
          {playerName ? `${playerName}'s` : "Your"} wellness data has been recorded.
        </p>
        {bodySelections.length > 0 && (
          <p className="mt-1 text-xs text-muted">
            {bodySelections.length} body area{bodySelections.length > 1 ? "s" : ""} marked.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setRatings({});
            setNotes("");
            setBodySelections([]);
            setBodyMapOpen(false);
            setSubmitted(false);
          }}
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

      {/* Body Map section — collapsible */}
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
                : "Tap to mark sore areas (optional)"}
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
        disabled={!allFilled}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Submit Check-in
      </button>
    </form>
  );
}
