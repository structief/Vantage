"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { DocIcon } from "@/components/icons/DocIcon";
import { slugToTitle } from "@/lib/utils";

interface SpecEntry {
  slug: string;
  group: string | null;
  path: string;
  status: "active" | "archived";
}

interface Props {
  owner: string;
  name: string;
}

export default function SpecsListClient({ owner, name }: Props) {
  const pathname = usePathname();
  const [specs, setSpecs] = useState<SpecEntry[] | null>(null);

  const repoBase = `/repo/${owner}/${name}`;
  const encodedFullName = encodeURIComponent(`${owner}/${name}`);

  useEffect(() => {
    setSpecs(null);
    fetch(`/api/repos/${encodedFullName}/specs`)
      .then((r) => r.json())
      .then((d) => setSpecs(d.specs ?? []))
      .catch(() => setSpecs([]));
  }, [encodedFullName]);

  if (specs === null) {
    return <SpecsSkeleton />;
  }

  if (specs.length === 0) {
    return (
      <p className="px-6 py-4 text-sm text-gray-400">
        No specs found in this repository.
      </p>
    );
  }

  // Partition into sections preserving API order (ungrouped → named groups → archived)
  const ungrouped = specs.filter((s) => s.group === null && s.status === "active");
  const archived = specs.filter((s) => s.status === "archived");
  const namedGroupNames = [
    ...new Set(
      specs
        .filter((s) => s.group !== null && s.status !== "archived")
        .map((s) => s.group as string)
    ),
  ];
  const byGroup = (group: string) => specs.filter((s) => s.group === group);

  return (
    <div className="flex flex-col gap-1 py-2">
      {/* Ungrouped active specs */}
      {ungrouped.map((spec) => (
        <SpecItem
          key={spec.path}
          spec={spec}
          repoBase={repoBase}
          pathname={pathname}
        />
      ))}

      {/* Named groups */}
      {namedGroupNames.map((group) => (
        <div key={group}>
          <GroupHeading label={slugToTitle(group)} />
          {byGroup(group).map((spec) => (
            <SpecItem
              key={spec.path}
              spec={spec}
              repoBase={repoBase}
              pathname={pathname}
            />
          ))}
        </div>
      ))}

      {/* Archived section */}
      {archived.length > 0 && (
        <div>
          <GroupHeading label="Archived" subdued />
          {archived.map((spec) => (
            <SpecItem
              key={spec.path}
              spec={spec}
              repoBase={repoBase}
              pathname={pathname}
              subdued
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupHeading({ label, subdued }: { label: string; subdued?: boolean }) {
  return (
    <p
      className={`px-4 pt-4 pb-1 text-[10px] font-semibold tracking-widest uppercase select-none ${
        subdued ? "text-gray-300" : "text-gray-400"
      }`}
    >
      {label}
    </p>
  );
}

function SpecItem({
  spec,
  repoBase,
  pathname,
  subdued,
}: {
  spec: SpecEntry;
  repoBase: string;
  pathname: string;
  subdued?: boolean;
}) {
  const href = `${repoBase}/specs/${spec.slug}`;
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 mx-2 px-3 py-2 rounded-md text-[13px] transition-colors ${
        isActive
          ? "bg-gray-100 text-gray-900 font-medium shadow-sm"
          : subdued
          ? "text-gray-400 hover:bg-gray-50 hover:text-gray-500"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      <DocIcon className="w-3 h-3 shrink-0 text-gray-400" />
      <span className="truncate">{spec.slug}</span>
    </Link>
  );
}

function SpecsSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {[72, 85, 60, 78, 65].map((w, i) => (
        <div key={i} className="flex items-center gap-2 py-1">
          <div className="w-3 h-3 rounded bg-gray-200 animate-pulse shrink-0" />
          <div
            className="h-3 rounded bg-gray-200 animate-pulse"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  );
}
