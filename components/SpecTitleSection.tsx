import Image from "next/image";
import { extractSpecMeta } from "@/lib/spec-utils";

type SpecStatus = "Draft" | "In review" | "Reviewed";

const STATUS_DOT: Record<SpecStatus, string> = {
  Draft: "bg-gray-400",
  "In review": "bg-amber-400",
  Reviewed: "bg-green-500",
};

interface Props {
  markdown: string;
  filename: string;
  login: string | null;
  avatarUrl: string | null;
  date: string | null;
  status: SpecStatus;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `Updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function SpecTitleSection({ markdown, filename, login, avatarUrl, date, status }: Props) {
  const { title } = extractSpecMeta(markdown, filename);

  return (
    <div className="mb-5">
      {/* Status row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono text-gray-400 tracking-wide uppercase">
          {filename}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${STATUS_DOT[status]}`} />
          {status}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-[26px] font-semibold text-gray-900 leading-tight tracking-tight mb-3">
        {title}
      </h1>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap text-[12px] text-gray-400">
        {(avatarUrl || login) && (
          <div className="flex items-center gap-1.5 text-gray-500">
            {avatarUrl && login && (
              <Image
                src={avatarUrl}
                alt={login}
                width={16}
                height={16}
                className="rounded-full"
              />
            )}
            {login && <span className="font-medium text-gray-600">{login}</span>}
          </div>
        )}
        {login && date && <span className="text-gray-200">·</span>}
        {date && <span>{formatDate(date)}</span>}
      </div>
    </div>
  );
}
