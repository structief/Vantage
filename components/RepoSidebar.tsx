"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRepoGradient, getRepoInitials } from "@/lib/gradients";
import RepoPicker from "@/components/RepoPicker";

export interface PinnedRepo {
  full_name: string;
  pinned_at: string;
}

interface Props {
  initialPinnedRepos: PinnedRepo[];
}

export default function RepoSidebar({ initialPinnedRepos }: Props) {
  const [repos, setRepos] = useState<PinnedRepo[]>(initialPinnedRepos);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    fullName: string;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Derive active repo from URL: /repo/[owner]/[name]
  const activeFullName = (() => {
    const match = pathname.match(/^\/repo\/([^/]+)\/([^/]+)/);
    return match ? `${match[1]}/${match[2]}` : null;
  })();

  // Close context menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    if (contextMenu) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [contextMenu]);

  const handleRepoClick = useCallback(
    (fullName: string) => {
      const [owner, name] = fullName.split("/");
      router.push(`/repo/${owner}/${name}`);
      // Sidebar order is stable — no re-sort on navigation
    },
    [router]
  );

  const handleContextMenu = (e: React.MouseEvent, fullName: string) => {
    e.preventDefault();
    setContextMenu({ fullName, x: e.clientX, y: e.clientY });
  };

  const handleRemove = useCallback(
    async (fullName: string) => {
      setContextMenu(null);
      setRepos((prev) => prev.filter((r) => r.full_name !== fullName));

      await fetch(`/api/pinned-repos/${encodeURIComponent(fullName)}`, { method: "DELETE" });

      if (fullName === activeFullName) {
        router.push("/");
      }
    },
    [activeFullName, router]
  );

  // Append new repos at the end; evict oldest if over cap
  const handleRepoAdded = (repo: PinnedRepo) => {
    setRepos((prev) => {
      const without = prev.filter((r) => r.full_name !== repo.full_name);
      const next = [...without, repo];
      return next.slice(-10);
    });
    setPickerOpen(false);
  };

  return (
    <>
      <aside className="flex flex-col items-center w-14 py-3 gap-2 bg-white border-r border-gray-100 shrink-0">
        {repos.map((repo) => {
          const repoName = repo.full_name.split("/")[1] ?? repo.full_name;
          const isActive = repo.full_name === activeFullName;
          return (
            <button
              key={repo.full_name}
              onClick={() => handleRepoClick(repo.full_name)}
              onContextMenu={(e) => handleContextMenu(e, repo.full_name)}
              title={repo.full_name}
              className={`relative w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0 transition-transform hover:scale-105 focus:outline-none ${
                isActive ? "ring-2 ring-offset-2 ring-gray-900" : ""
              }`}
              style={{ background: getRepoGradient(repo.full_name) }}
            >
              {getRepoInitials(repoName)}
            </button>
          );
        })}

        <button
          onClick={() => setPickerOpen(true)}
          title="Add repository"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-600 transition-colors mt-1 shrink-0"
        >
          <PlusIcon />
        </button>
      </aside>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => handleRemove(contextMenu.fullName)}
          >
            Remove from sidebar
          </button>
        </div>
      )}

      {/* Repo picker */}
      {pickerOpen && (
        <RepoPicker
          pinnedRepos={repos}
          onAdd={handleRepoAdded}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
