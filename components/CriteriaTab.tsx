import { extractRequirementNames } from "@/lib/spec-utils";

interface Props {
  markdown: string;
  validatedIndices: Set<number>;
  onToggle: (index: number) => void;
  disabled?: boolean;
}

export default function CriteriaTab({ markdown, validatedIndices, onToggle, disabled }: Props) {
  const requirements = extractRequirementNames(markdown);

  if (requirements.length === 0) {
    return (
      <p className="text-[13px] text-gray-400 py-4">No criteria defined for this spec.</p>
    );
  }

  return (
    <div className="relative">
      {disabled && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-lg"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-[13px] text-gray-600">Saving…</span>
          </div>
        </div>
      )}
      <ul
        className={`flex flex-col divide-y divide-gray-50/80 transition-opacity ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
      {requirements.map((name, i) => {
        const validated = validatedIndices.has(i);
        return (
          <li key={i} className="flex items-center gap-3 py-3.5">
            <button
              type="button"
              onClick={() => onToggle(i)}
              aria-label={validated ? `Unvalidate: ${name}` : `Validate: ${name}`}
              aria-checked={validated}
              role="checkbox"
              className={`shrink-0 w-4 h-4 rounded border transition-colors ${
                validated
                  ? "bg-gray-400 border-gray-400 flex items-center justify-center"
                  : "bg-white border-gray-200 hover:border-gray-400"
              }`}
            >
              {validated && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="1.5,5 4,7.5 8.5,2.5" />
                </svg>
              )}
            </button>
            <span
              className={`flex-1 text-[13px] leading-snug cursor-pointer select-none ${validated ? "text-gray-400 hover:text-gray-500 line-through": "text-gray-900 hover:text-gray-700"}`}
              onClick={() => onToggle(i)}
            >
              {name}
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                validated
                  ? "text-green-700 border-green-200 bg-green-50"
                  : "text-gray-400 border-gray-100 bg-white"
              }`}
            >
              {validated ? "validated" : "pending"}
            </span>
          </li>
        );
      })}
      </ul>
    </div>
  );
}
