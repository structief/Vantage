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
  isEditing?: boolean;
  isSaving?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `Updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function SpecTitleSection({
  markdown,
  filename,
  login,
  avatarUrl,
  date,
  status,
  isEditing = false,
  isSaving = false,
  canEdit = false,
  onEdit,
  onSave,
  onCancel,
}: Props) {
  const { title } = extractSpecMeta(markdown, filename);

  return (
    <div className="mb-5">
      {/* Status row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono text-gray-400 tracking-wide uppercase">
          {filename}
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${STATUS_DOT[status]}`} />
            {status}
          </span>
          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 1.5l2 2L3 11H1V9L8.5 1.5z" />
              </svg>
              Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="inline-flex items-center rounded border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center rounded bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
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
