"use client";

import { useEffect, useState, useCallback } from "react";

interface Repository {
  id: number;
  full_name: string;
  name: string;
  owner_login: string;
  visibility: "public" | "private";
  default_branch: string;
  read_only: boolean;
}

interface RepoListResponse {
  fetched_at: string;
  stale: boolean;
  rate_limit_hit?: boolean;
  repositories: Repository[];
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: RepoListResponse };

export default function RepoList() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (endpoint = "/api/repos", method = "GET") => {
    try {
      const res = await fetch(endpoint, { method });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setState({
          status: "error",
          message: body.message ?? "Failed to load repositories.",
        });
        return;
      }
      const data: RepoListResponse = await res.json();
      setState({ status: "ready", data });
    } catch {
      setState({ status: "error", message: "Could not reach the server." });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load("/api/repos/refresh", "POST");
    setRefreshing(false);
  }

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-12 justify-center">
        <Spinner />
        Loading repositories…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {state.message}
      </div>
    );
  }

  const { data } = state;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            Repositories
          </h1>
          {data.stale && (
            <p className="text-xs text-amber-600 mt-0.5">
              {data.rate_limit_hit
                ? "GitHub rate limit reached — showing cached list."
                : "Cache is stale."}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {data.repositories.length} repo
            {data.repositories.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshIcon spinning={refreshing} />
            Refresh
          </button>
        </div>
      </div>

      {/* Empty state */}
      {data.repositories.length === 0 && (
        <div className="text-center py-16 text-sm text-gray-400">
          No repositories found. Make sure your GitHub account has access to at
          least one repository.
        </div>
      )}

      {/* Repo list */}
      {data.repositories.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {data.repositories.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                  <RepoIcon />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {repo.full_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {repo.default_branch}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 shrink-0">
                {repo.read_only && (
                  <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                    read-only
                  </span>
                )}
                <span
                  className={`text-xs rounded px-1.5 py-0.5 ${
                    repo.visibility === "private"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {repo.visibility}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
    >
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="28"
        strokeDashoffset="10"
      />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={spinning ? "animate-spin" : ""}
    >
      <path
        d="M10.5 6A4.5 4.5 0 1 1 6 1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M6 1.5L8 3.5M6 1.5L8 0"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RepoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect
        x="1"
        y="1"
        width="11"
        height="11"
        rx="2"
        stroke="#9ca3af"
        strokeWidth="1.2"
      />
      <path
        d="M4 4.5h5M4 6.5h3"
        stroke="#9ca3af"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
