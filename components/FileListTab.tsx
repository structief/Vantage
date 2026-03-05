import { DocIcon } from "@/components/icons/DocIcon";

interface Props {
  files: string[];
  emptyMessage: string;
}

export default function FileListTab({ files, emptyMessage }: Props) {
  if (files.length === 0) {
    return <p className="text-[13px] text-gray-400 py-4">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-gray-50/80">
      {files.map((filename) => (
        <li key={filename} className="flex items-center gap-2.5 py-3.5">
          <DocIcon className="w-3.5 h-3.5 shrink-0 text-gray-300" />
          <span className="text-[13px] text-gray-600 font-mono">{filename}</span>
        </li>
      ))}
    </ul>
  );
}
