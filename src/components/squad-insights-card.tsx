import Link from "next/link";
import { Fragment } from "react";
import { Lightbulb } from "lucide-react";
import type { SquadInsight } from "@/lib/squad-insights";

const MAX_VISIBLE_LINKS = 5;

const styleMap = {
  warning: "bg-orange-50 text-orange-800",
  positive: "bg-emerald-50 text-emerald-800",
  neutral: "bg-gray-50 text-muted",
};

const iconMap = { warning: "!", positive: "+", neutral: "\u2013" };

interface SquadInsightsCardProps {
  insights: SquadInsight[];
  playerNames: Record<string, string>;
}

export default function SquadInsightsCard({ insights, playerNames }: SquadInsightsCardProps) {
  if (insights.length === 0) return null;

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-5">
      <div className="mb-3 flex items-center gap-1.5">
        <Lightbulb className="h-4 w-4 text-muted" />
        <h3 className="text-sm font-semibold text-foreground">Squad Insights</h3>
      </div>
      <div className="space-y-1.5">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${styleMap[insight.type]}`}
          >
            <span className="mt-0.5 shrink-0 font-bold">{iconMap[insight.type]}</span>
            <span>
              {insight.text}
              {insight.playerIds.length > 0 && (
                <>
                  {": "}
                  {insight.playerIds.slice(0, MAX_VISIBLE_LINKS).map((id, j) => (
                    <Fragment key={id}>
                      {j > 0 && ", "}
                      <Link
                        href={`/players/${id}`}
                        className="font-medium underline decoration-current/30 hover:decoration-current"
                      >
                        {playerNames[id] ?? id}
                      </Link>
                    </Fragment>
                  ))}
                  {insight.playerIds.length > MAX_VISIBLE_LINKS && (
                    <span> +{insight.playerIds.length - MAX_VISIBLE_LINKS} more</span>
                  )}
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
