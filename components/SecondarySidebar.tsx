"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRepoGradient, getRepoInitials } from "@/lib/gradients";
import { getProjectInitials } from "@/lib/utils";
import { useSidebarMode } from "@/components/SidebarModeProvider";

interface Project {
  slug: string;
  name: string;
  specCount: number;
}

const NAV_LINKS = [
  { key: "specs", label: "All Specs", icon: <GridIcon />, suffix: "/specs" },
  { key: "activity", label: "Activity", icon: <BellIcon />, suffix: "/activity" },
  { key: "settings", label: "Settings", icon: <GearIcon />, suffix: "/settings" },
] as const;

export default function SecondarySidebar() {
  const { mode } = useSidebarMode();
  const pathname = usePathname();
  const router = useRouter();

  const activeFullName = (() => {
    const match = pathname.match(/^\/repo\/([^/]+)\/([^/]+)/);
    return match ? `${match[1]}/${match[2]}` : null;
  })();

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeFullName) return;
    setProjects(null);
    fetch(`/api/repos/${encodeURIComponent(activeFullName)}/projects`)
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]));
  }, [activeFullName]);

  if (!activeFullName) return null;

  const repoName = activeFullName.split("/")[1] ?? activeFullName;
  const isExpanded = mode === "expanded";

  const toggleGroup = (slug: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const repoBase = `/repo/${activeFullName}`;

  return (
    <aside
      data-testid="secondary-sidebar"
      className="flex flex-col shrink-0 bg-[#f7f7f8] border-r border-gray-100 bg-white overflow-hidden transition-all duration-200 px-3"
      style={{ width: isExpanded ? 240 : 52 }}
    >
      {/* Repo identity */}
      <div className={`flex items-center gap-2.5 px-3 pt-4 pb-2 ${isExpanded ? "" : "justify-center"}`}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0"
          style={{ background: getRepoGradient(activeFullName) }}
        >
          {getRepoInitials(repoName)}
        </div>
        {isExpanded && (
          <span className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
            {repoName}
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex flex-col px-2 gap-1.5 mt-3 mb-5">
        {NAV_LINKS.map(({ key, label, icon, suffix }) => {
          const href = `${repoBase}${suffix}`;
          const isActive = pathname.startsWith(href);
          return (
            <button
              key={key}
              onClick={() => router.push(href)}
              title={!isExpanded ? label : undefined}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] transition-colors w-full text-left ${
                isExpanded ? "px-3" : "px-1 justify-center"
              } ${
                isActive
                  ? "bg-gray-50 text-gray-900 font-semibold shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <span className="shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>
              {isExpanded && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Projects section */}
      {isExpanded && (
        <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-gray-400 uppercase select-none">
          Projects
        </p>
      )}

      <div className={`flex flex-col flex-1 overflow-y-auto ${isExpanded ? "px-2" : "px-2 items-center gap-2"}`}>
        {projects === null ? (
          /* Skeleton */
          isExpanded ? (
            <div className="flex flex-col gap-2 mt-1">
              {[80, 65, 72].map((w) => (
                <div key={w} className="flex items-center gap-2 px-2 py-1">
                  <div className="h-3 rounded bg-gray-200 animate-pulse" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-md bg-gray-200 animate-pulse" />
              ))}
            </div>
          )
        ) : projects.length === 0 ? (
          isExpanded ? (
            <p className="px-2 text-[12px] text-gray-400 mt-2">No projects yet.</p>
          ) : null
        ) : isExpanded ? (
          /* Expanded project list */
          <div className="flex flex-col gap-0.5">
            {projects.map((project) => {
              const isOpen = expandedGroups.has(project.slug);
              return (
                <div key={project.slug}>
                  <button
                    onClick={() => toggleGroup(project.slug)}
                    className="flex items-center gap-1.5 w-full px-3 py-2 rounded-md text-[13px] font-semibold text-gray-700 hover:bg-gray-100/50 transition-colors"
                  >
                    <ChevronIcon className={`w-3 h-3 shrink-0 text-gray-400 transition-transform duration-150 ml-1 ${isOpen ? "rotate-90" : ""}`} />
                    <span className="flex-1 text-left truncate ml-1">{project.name}</span>
                    {project.specCount > 0 && (
                      <span className="text-[11px] text-gray-400 font-normal">{project.specCount}</span>
                    )}
                  </button>
                  {isOpen && project.specCount > 0 && (
                    <SpecPlaceholderList repoBase={repoBase} slug={project.slug} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Collapsed: initial squares */
          <div className="flex flex-col gap-2 mt-1">
            {projects.map((project) => (
              <div
                key={project.slug}
                title={project.name}
                className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 select-none cursor-default"
              >
                {getProjectInitials(project.slug)}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function SpecPlaceholderList({ repoBase, slug }: { repoBase: string; slug: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-0.5 ml-4 mb-1">
      <button
        onClick={() => router.push(`${repoBase}/specs/${slug}`)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-[12px] text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors text-left"
      >
        <DocIcon className="w-3 h-3 shrink-0 text-gray-400" />
        <span className="truncate">{slug}</span>
      </button>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path
        d="M7.5 1.5a4 4 0 0 0-4 4v2.5l-1 1.5h10l-1-1.5V5.5a4 4 0 0 0-4-4ZM6 11.5a1.5 1.5 0 0 0 3 0"
        stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1.06 1.06M11.04 11.04l1.06 1.06M2.9 12.1l1.06-1.06M11.04 3.96l1.06-1.06"
        stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M4 2.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="2" y="1" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M4 4h4M4 6.5h4M4 9h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
