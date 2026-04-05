"use client";

import { useState } from "react";
import Sparkline from "./sparkline";

const RANGES = [
  { label: "7d", value: 7 },
  { label: "14d", value: 14 },
  { label: "30d", value: 30 },
  { label: "All", value: 0 },
] as const;

export interface DataPoint {
  date: string;
  value: number;
}

interface AnalyticsChartProps {
  title: string;
  points: DataPoint[];
  color: string;
  unit?: string;
  defaultRange?: number;
}

export default function AnalyticsChart({
  title,
  points,
  color,
  unit = "",
  defaultRange = 14,
}: AnalyticsChartProps) {
  const [range, setRange] = useState(defaultRange);

  const filtered = range === 0
    ? points
    : points.slice(-range);

  const values = filtered.map((p) => p.value);
  const latest = values.length > 0 ? values[values.length - 1] : null;
  const avg = values.length > 0
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    : null;
  const min = values.length > 0 ? Math.min(...values) : null;
  const max = values.length > 0 ? Math.max(...values) : null;

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                range === r.value
                  ? "bg-foreground text-white"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {values.length < 2 ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted">
          Not enough data for this range.
        </div>
      ) : (
        <>
          <Sparkline
            data={values}
            width={500}
            height={100}
            color={color}
            currentValue={latest !== null ? `${latest}${unit ? ` ${unit}` : ""}` : undefined}
          />

          {/* Mini stat row */}
          <div className="mt-3 flex gap-4 text-xs text-muted">
            <span>Avg: <span className="font-semibold text-foreground">{avg}{unit ? ` ${unit}` : ""}</span></span>
            <span>Min: <span className="font-semibold text-foreground">{min}{unit ? ` ${unit}` : ""}</span></span>
            <span>Max: <span className="font-semibold text-foreground">{max}{unit ? ` ${unit}` : ""}</span></span>
            <span>{filtered.length} points</span>
          </div>

          {/* Date range label */}
          <div className="mt-1 flex justify-between text-[10px] text-muted">
            <span>{filtered[0]?.date}</span>
            <span>{filtered[filtered.length - 1]?.date}</span>
          </div>
        </>
      )}
    </div>
  );
}
