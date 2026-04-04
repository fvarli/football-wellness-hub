"use client";

import { useState } from "react";
import type { BodyMapView, BodyMapSelection, BodySide } from "@/lib/types";
import { getRegionMeta, getPrimaryView } from "@/lib/body-regions";
import MaleFrontSvg from "./male-front-svg";
import MaleBackSvg from "./male-back-svg";
import { X, Hand } from "lucide-react";

/* ── Severity styling (4-band scale) ──
 *  1-3  mild      #fde68a / #b45309
 *  4-6  moderate  #fb923c / #c2410c
 *  7-8  high      #f97316 / #c2410c
 *  9-10 severe    #dc2626 / #991b1b
 */

function sevFill(s: number): string {
  if (s <= 3) return "#fde68a";
  if (s <= 6) return "#fb923c";
  if (s <= 8) return "#f97316";
  return "#dc2626";
}
function sevStroke(s: number): string {
  if (s <= 3) return "#b45309";
  if (s <= 6) return "#c2410c";
  if (s <= 8) return "#9a3412";
  return "#991b1b";
}
function sevLabel(s: number): string {
  if (s <= 3) return "Mild";
  if (s <= 6) return "Moderate";
  if (s <= 8) return "High";
  return "Severe";
}
/** Badge background for the severity chip in the selected-areas list. */
function sevBadgeBg(s: number): string {
  if (s <= 3) return "#b45309";
  if (s <= 6) return "#c2410c";
  if (s <= 8) return "#9a3412";
  return "#991b1b";
}

/* ── Severity picker ── */

function SeverityPicker({
  label,
  severity,
  onChange,
  onRemove,
}: {
  label: string;
  severity: number | null;
  onChange: (v: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-card-border bg-white p-3 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-[11px] text-muted">1 = minimal &middot; 10 = severe</p>
        </div>
        {severity != null && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-danger-light transition-colors"
          >
            <X className="h-3 w-3" />
            Remove
          </button>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const selected = severity === n;
          let cls = "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100";
          if (selected) {
            if (n <= 3) cls = "bg-amber-300 text-amber-900 border-amber-400";
            else if (n <= 6) cls = "bg-orange-400 text-white border-orange-500";
            else if (n <= 8) cls = "bg-orange-500 text-white border-orange-600";
            else cls = "bg-red-600 text-white border-red-700";
          }
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition-all ${cls}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Selected regions list ── */

function SelectionList({
  selections,
  activeKey,
  onSelect,
  onRemove,
  readOnly,
}: {
  selections: BodyMapSelection[];
  activeKey: string | null;
  onSelect: (key: string) => void;
  onRemove: (key: string) => void;
  readOnly?: boolean;
}) {
  const sorted = [...selections].sort((a, b) =>
    b.severity - a.severity || a.label.localeCompare(b.label)
  );
  return (
    <div className="space-y-1.5">
      {sorted.map((s) => (
        <div
          key={s.regionKey}
          className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
            activeKey === s.regionKey
              ? "border-blue-300 bg-blue-50/50"
              : "border-card-border bg-white"
          } ${readOnly ? "" : "cursor-pointer hover:bg-gray-50"}`}
          onClick={readOnly ? undefined : () => onSelect(s.regionKey)}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white"
              style={{ backgroundColor: sevBadgeBg(s.severity) }}
            >
              {s.severity}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{s.label}</p>
              <p className="text-[10px] text-muted capitalize">
                {s.view} &middot; {s.side ?? "center"} &middot; {sevLabel(s.severity)}
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(s.regionKey); }}
              className="ml-2 rounded-md p-1 text-muted hover:bg-gray-100 hover:text-danger transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main BodyMap component ── */

interface BodyMapProps {
  selections: BodyMapSelection[];
  onChange?: (selections: BodyMapSelection[]) => void;
  readOnly?: boolean;
}

export default function BodyMap({ selections, onChange, readOnly }: BodyMapProps) {
  const [mobileView, setMobileView] = useState<BodyMapView>("front");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const activeMeta = activeKey ? getRegionMeta(activeKey) : null;
  const activeSel = selections.find((s) => s.regionKey === activeKey);

  // Build a Map<regionKey, severity> for fast SVG lookups
  const selMap = new Map(selections.map((s) => [s.regionKey, s.severity]));

  function handleRegionClick(key: string) {
    if (readOnly) return;
    setActiveKey((prev) => (prev === key ? null : key));
    const view = getPrimaryView(key);
    setMobileView(view);
  }

  function handleSeverityChange(severity: number) {
    if (!activeKey || !activeMeta || !onChange) return;
    const next = selections.filter((s) => s.regionKey !== activeKey);
    next.push({
      regionKey: activeKey,
      label: activeMeta.label,
      view: getPrimaryView(activeKey),
      side: activeMeta.side as BodySide | null,
      severity,
    });
    onChange(next);
  }

  function handleRemove(key?: string) {
    const k = key ?? activeKey;
    if (!k || !onChange) return;
    onChange(selections.filter((s) => s.regionKey !== k));
    if (k === activeKey) setActiveKey(null);
  }

  function handleSelectFromList(key: string) {
    setActiveKey((prev) => (prev === key ? null : key));
    setMobileView(getPrimaryView(key));
  }

  const frontCount = selections.filter((s) => getPrimaryView(s.regionKey) === "front").length;
  const backCount = selections.length - frontCount;

  const svgProps = {
    selections: selMap,
    activeKey,
    readOnly,
    onRegionClick: handleRegionClick,
    sevFill,
    sevStroke,
    getLabel: (key: string) => getRegionMeta(key)?.label ?? key,
  };

  return (
    <div>
      {/* Perspective note */}
      <p className="mb-3 text-center text-[10px] text-muted tracking-wide">
        Shown as your own body &mdash; left is your left
      </p>

      {/* ── Mobile tabs (below md) ── */}
      <div className="mb-3 flex justify-center gap-1.5 md:hidden">
        {(["front", "back"] as BodyMapView[]).map((v) => {
          const count = v === "front" ? frontCount : backCount;
          return (
            <button
              key={v}
              type="button"
              onClick={() => { setMobileView(v); setActiveKey(null); }}
              className={`rounded-lg px-5 py-2 text-xs font-semibold capitalize transition-colors ${
                mobileView === v
                  ? "bg-foreground text-white shadow-sm"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              {v}
              {count > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Mobile: single panel ── */}
      <div className="md:hidden flex flex-col items-center">
        <div className="w-full max-w-[220px]" style={{ minHeight: 360 }}>
          {mobileView === "front" ? (
            <MaleFrontSvg {...svgProps} />
          ) : (
            <MaleBackSvg {...svgProps} />
          )}
        </div>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
          {mobileView}
        </span>
      </div>

      {/* ── Desktop: side-by-side ── */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-6">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[190px]" style={{ minHeight: 320 }}>
            <MaleFrontSvg {...svgProps} />
          </div>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Front</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[170px]" style={{ minHeight: 320 }}>
            <MaleBackSvg {...svgProps} />
          </div>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Back</span>
        </div>
      </div>

      {/* ── Severity picker ── */}
      {!readOnly && activeMeta && (
        <div className="mt-4">
          <SeverityPicker
            label={activeMeta.label}
            severity={activeSel?.severity ?? null}
            onChange={handleSeverityChange}
            onRemove={() => handleRemove()}
          />
        </div>
      )}

      {/* ── Empty state ── */}
      {!readOnly && selections.length === 0 && !activeKey && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-4 text-xs text-muted">
          <Hand className="h-4 w-4" />
          Select muscle groups with soreness, tightness, or pain
        </div>
      )}

      {/* ── Selected areas summary ── */}
      {selections.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Selected Areas ({selections.length})
          </p>
          <SelectionList
            selections={selections}
            activeKey={activeKey}
            onSelect={handleSelectFromList}
            onRemove={handleRemove}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
}
