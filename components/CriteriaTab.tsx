import { extractRequirementNames } from "@/lib/spec-utils";

interface Props {
  markdown: string;
}

export default function CriteriaTab({ markdown }: Props) {
  const requirements = extractRequirementNames(markdown);

  if (requirements.length === 0) {
    return (
      <p className="text-[13px] text-gray-400 py-4">No criteria defined for this spec.</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-gray-50/80">
      {requirements.map((name, i) => (
        <li key={i} className="flex items-center gap-3 py-3.5">
          <span className="shrink-0 w-4 h-4 rounded border border-gray-200 bg-white" />
          <span className="flex-1 text-[13px] text-gray-700 leading-snug">{name}</span>
          <span className="text-[11px] text-gray-400 font-medium px-2 py-0.5 rounded-full border border-gray-100">
            pending
          </span>
        </li>
      ))}
    </ul>
  );
}
