"use client";

import { useState } from "react";
import {
  BODY_REGIONS,
  type BodyView,
  type BodyMapSelection,
  type BodyRegionDef,
} from "@/lib/types";

// ── SVG body silhouette path (shared between front & back) ──
const BODY_PATH =
  "M100,16 C82,16 76,32 76,42 C76,52 84,60 90,63 L90,74 " +
  "L56,84 Q36,90 34,116 L32,174 L42,176 L44,118 Q46,96 58,90 " +
  "L64,130 L62,172 L68,200 L74,208 L78,250 L76,296 L74,340 L70,376 L66,398 " +
  "L84,398 L82,376 L82,340 L84,296 L88,250 L96,214 L100,208 " +
  "L104,214 L112,250 L116,296 L118,340 L118,376 L116,398 " +
  "L134,398 L130,376 L126,340 L124,296 L122,250 L126,208 L132,200 " +
  "L138,172 L136,130 L142,90 Q154,96 156,118 L158,176 L168,174 " +
  "L166,116 Q164,90 144,84 L110,74 L110,63 " +
  "C116,60 124,52 124,42 C124,32 118,16 100,16 Z";

function severityColor(severity: number): string {
  if (severity <= 3) return "#fbbf24"; // amber-400
  if (severity <= 6) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

function severityFill(severity: number): string {
  if (severity <= 3) return "rgba(251,191,36,0.35)";
  if (severity <= 6) return "rgba(249,115,22,0.4)";
  return "rgba(239,68,68,0.45)";
}

// ── Region ellipse ──
function RegionEllipse({
  region,
  selection,
  active,
  onClick,
  readOnly,
}: {
  region: BodyRegionDef;
  selection?: BodyMapSelection;
  active: boolean;
  onClick: () => void;
  readOnly?: boolean;
}) {
  const hasSelection = !!selection;
  const sev = selection?.severity ?? 0;

  let fill = "rgba(148,163,184,0.15)"; // default: slate hint
  let stroke = "#94a3b8";
  let strokeW = 1;

  if (hasSelection) {
    fill = severityFill(sev);
    stroke = severityColor(sev);
    strokeW = 2;
  }
  if (active) {
    stroke = "#3b82f6";
    strokeW = 2.5;
  }

  return (
    <ellipse
      cx={region.cx}
      cy={region.cy}
      rx={region.rx}
      ry={region.ry}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeW}
      className={readOnly ? "" : "cursor-pointer"}
      onClick={readOnly ? undefined : onClick}
      strokeDasharray={hasSelection ? undefined : "3 2"}
    >
      <title>{region.label}{hasSelection ? ` — severity ${sev}` : ""}</title>
    </ellipse>
  );
}

// ── Body SVG panel ──
function BodyPanel({
  view,
  selections,
  activeRegion,
  onRegionClick,
  readOnly,
}: {
  view: BodyView;
  selections: BodyMapSelection[];
  activeRegion: string | null;
  onRegionClick: (id: string) => void;
  readOnly?: boolean;
}) {
  const regions = BODY_REGIONS.filter((r) => r.view === view);
  const selMap = new Map(selections.map((s) => [s.regionId, s]));

  return (
    <svg viewBox="0 0 200 414" className="mx-auto h-full max-h-[340px] w-auto">
      {/* Silhouette */}
      <path d={BODY_PATH} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={1} />
      {/* Clickable regions */}
      {regions.map((r) => (
        <RegionEllipse
          key={r.id}
          region={r}
          selection={selMap.get(r.id)}
          active={activeRegion === r.id}
          onClick={() => onRegionClick(r.id)}
          readOnly={readOnly}
        />
      ))}
      {/* View label */}
      <text x="100" y="410" textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight={500}>
        {view === "front" ? "FRONT" : "BACK"}
      </text>
    </svg>
  );
}

// ── Severity picker ──
function SeverityPicker({
  regionLabel,
  severity,
  onChange,
  onRemove,
}: {
  regionLabel: string;
  severity: number | null;
  onChange: (v: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-info/30 bg-info-light/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{regionLabel}</p>
        {severity != null && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-danger hover:underline"
          >
            Remove
          </button>
        )}
      </div>
      <p className="mb-2 text-xs text-muted">Severity: 1 = minimal, 10 = severe</p>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const selected = severity === n;
          let bg = "bg-gray-100 text-gray-400 hover:bg-gray-200";
          if (selected) {
            if (n <= 3) bg = "bg-amber-400 text-white";
            else if (n <= 6) bg = "bg-orange-500 text-white";
            else bg = "bg-red-500 text-white";
          }
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold transition-all ${bg}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main BodyMap component ──
interface BodyMapProps {
  selections: BodyMapSelection[];
  onChange?: (selections: BodyMapSelection[]) => void;
  readOnly?: boolean;
}

export default function BodyMap({ selections, onChange, readOnly }: BodyMapProps) {
  const [view, setView] = useState<BodyView>("front");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  const activeRegionDef = BODY_REGIONS.find((r) => r.id === activeRegion);
  const activeSel = selections.find((s) => s.regionId === activeRegion);

  function handleRegionClick(id: string) {
    if (readOnly) return;
    setActiveRegion((prev) => (prev === id ? null : id));
    // Switch view if the clicked region is on the other side
    const region = BODY_REGIONS.find((r) => r.id === id);
    if (region && region.view !== view) setView(region.view);
  }

  function handleSeverityChange(severity: number) {
    if (!activeRegion || !onChange) return;
    const next = selections.filter((s) => s.regionId !== activeRegion);
    next.push({ regionId: activeRegion, severity });
    onChange(next);
  }

  function handleRemove() {
    if (!activeRegion || !onChange) return;
    onChange(selections.filter((s) => s.regionId !== activeRegion));
    setActiveRegion(null);
  }

  return (
    <div>
      {/* View tabs */}
      <div className="mb-3 flex justify-center gap-1">
        {(["front", "back"] as BodyView[]).map((v) => {
          const count = selections.filter((s) => {
            const r = BODY_REGIONS.find((b) => b.id === s.regionId);
            return r?.view === v;
          }).length;
          return (
            <button
              key={v}
              type="button"
              onClick={() => { setView(v); setActiveRegion(null); }}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                view === v
                  ? "bg-foreground text-white"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              {v}
              {count > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Body SVG */}
      <div className="flex justify-center">
        <BodyPanel
          view={view}
          selections={selections}
          activeRegion={activeRegion}
          onRegionClick={handleRegionClick}
          readOnly={readOnly}
        />
      </div>

      {/* Severity picker (shown when a region is active) */}
      {!readOnly && activeRegionDef && (
        <div className="mt-3">
          <SeverityPicker
            regionLabel={activeRegionDef.label}
            severity={activeSel?.severity ?? null}
            onChange={handleSeverityChange}
            onRemove={handleRemove}
          />
        </div>
      )}

      {/* Selection legend for read-only */}
      {readOnly && selections.length > 0 && (
        <div className="mt-3 space-y-1">
          {selections.map((s) => {
            const region = BODY_REGIONS.find((r) => r.id === s.regionId);
            if (!region) return null;
            return (
              <div key={s.regionId} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5">
                <span className="text-xs font-medium text-foreground">{region.label}</span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: severityColor(s.severity) }}
                >
                  {s.severity}/10
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
