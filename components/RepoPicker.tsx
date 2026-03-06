"use client";

import { useEffect, useRef, useState } from "react";
import { PinnedRepo } from "@/components/RepoSidebar";

interface Repository {
  id: number;
  full_name: string;
  name: string;
  owner_login: string;
}

interface RepoListResponse {
  repositories: Repository[];
}

interface Props {
  pinnedRepos: PinnedRepo[];
  onAdd: (repo: PinnedRepo) => void;
  onClose: () => void;
}

export default function RepoPicker({ pinnedRepos, onAdd, onClose }: Props) {
  const [allRepos, setAllRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/repos")
      .then((r) => r.json())
      .then((data: RepoListResponse) => setAllRepos(data.repositories ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Dismiss on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Dismiss on click-outside
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  const pinnedSet = new Set(pinnedRepos.map((r) => r.full_name));
  const available = allRepos.filter((r) => !pinnedSet.has(r.full_name));

  async function handleSelect(fullName: string) {
    setAdding(fullName);
    try {
      const res = await fetch("/api/pinned-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });
      if (res.ok) {
        const data: { full_name: string; pinned_at: string } = await res.json();
        onAdd(data);
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 flex items-start justify-center pt-24 bg-black/20"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Add repository</p>
          <p className="text-xs text-gray-400 mt-0.5">Select a repository to pin to your sidebar</p>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-10 text-sm text-gray-400">
              Loading…
            </div>
          )}

          {!loading && available.length === 0 && (
            <div className="flex items-center justify-center py-10 text-sm text-gray-400 text-center px-4">
              All your repositories have been added.
            </div>
          )}

          {!loading &&
            available.map((repo) => (
              <button
                key={repo.id}
                disabled={adding === repo.full_name}
                onClick={() => handleSelect(repo.full_name)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <span className="text-sm font-medium text-gray-900 truncate">{repo.full_name}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
