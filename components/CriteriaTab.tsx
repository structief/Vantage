import { extractRequirementNames } from "@/lib/spec-utils";

interface Props {
  markdown: string;
  validatedIndices: Set<number>;
  onToggle: (index: number) => void;
}

export default function CriteriaTab({ markdown, validatedIndices, onToggle }: Props) {
  const requirements = extractRequirementNames(markdown);

  if (requirements.length === 0) {
    return (
      <p className="text-[13px] text-gray-400 py-4">No criteria defined for this spec.</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-gray-50/80">
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
                  ? "bg-gray-900 border-gray-900 flex items-center justify-center"
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
              className="flex-1 text-[13px] text-gray-700 leading-snug cursor-pointer select-none"
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
  );
}
