/**
 * Lightweight SVG sparkline — no external chart library needed.
 * Renders a polyline from data points with optional filled area.
 */

interface SparklineProps {
  /** Data values to plot (oldest first). */
  data: number[];
  /** SVG width. Default 200. */
  width?: number;
  /** SVG height. Default 48. */
  height?: number;
  /** Stroke color. Default "#10b981" (accent green). */
  color?: string;
  /** Show filled area under the line. Default true. */
  filled?: boolean;
  /** Label shown below the chart. */
  label?: string;
  /** Current value shown prominently. */
  currentValue?: string;
}

export default function Sparkline({
  data,
  width = 200,
  height = 48,
  color = "#10b981",
  filled = true,
  label,
  currentValue,
}: SparklineProps) {
  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width, minHeight: height + 24 }}>
        <p className="text-xs text-muted">Not enough data</p>
      </div>
    );
  }

  const padding = 2;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // avoid division by zero for flat lines

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * plotW;
    const y = padding + plotH - ((v - min) / range) * plotH;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");

  // Filled area: close the shape along the bottom
  const areaPath = `M${points[0]} ${polyline.split(" ").slice(1).map((p) => `L${p}`).join(" ")} L${padding + plotW},${padding + plotH} L${padding},${padding + plotH} Z`;

  return (
    <div>
      {(label || currentValue) && (
        <div className="mb-1 flex items-baseline justify-between">
          {label && <span className="text-xs text-muted">{label}</span>}
          {currentValue && <span className="text-sm font-bold text-foreground">{currentValue}</span>}
        </div>
      )}
      <svg width={width} height={height} className="overflow-visible">
        {filled && (
          <path d={areaPath} fill={color} opacity={0.1} />
        )}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dot on the last point */}
        {(() => {
          const last = points[points.length - 1].split(",");
          return (
            <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
          );
        })()}
      </svg>
    </div>
  );
}
