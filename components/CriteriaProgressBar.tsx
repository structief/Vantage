interface Props {
  total: number;
  validated: number;
}

export default function CriteriaProgressBar({ total, validated }: Props) {
  if (total === 0) return null;

  const pct = Math.round((validated / total) * 100);
  const isComplete = validated === total;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-2">
        {/* Track */}
        <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isComplete ? "bg-green-500" : "bg-gray-800"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-[12px] text-gray-400 tabular-nums">
          {validated} of {total} criteria validated
        </span>
      </div>
    </div>
  );
}
