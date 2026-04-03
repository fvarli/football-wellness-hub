"use client";

interface RatingInputProps {
  label: string;
  lowLabel: string;
  highLabel: string;
  value: number | null;
  onChange: (value: number) => void;
}

function ratingColor(n: number, selected: boolean): string {
  if (!selected) return "bg-gray-100 text-gray-400 hover:bg-gray-200";
  if (n <= 3) return "bg-red-500 text-white";
  if (n <= 5) return "bg-amber-400 text-white";
  if (n <= 7) return "bg-emerald-400 text-white";
  return "bg-emerald-600 text-white";
}

export default function RatingInput({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
}: RatingInputProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`
              flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold
              transition-all duration-100
              ${ratingColor(n, value === n)}
            `}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
