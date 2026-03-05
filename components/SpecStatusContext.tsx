"use client";

import { createContext, useCallback, useContext, useState } from "react";

type SpecStatus = "Draft" | "In review" | "Reviewed";

interface SpecStatusContextValue {
  getStatus: (pathOrSlug: string) => SpecStatus;
  updateSpecStatus: (pathOrSlug: string, status: SpecStatus) => void;
  preloadStatuses: (statuses: Record<string, SpecStatus>) => void;
}

const SpecStatusContext = createContext<SpecStatusContextValue>({
  getStatus: () => "Draft",
  updateSpecStatus: () => {},
  preloadStatuses: () => {},
});

export function SpecStatusProvider({ children }: { children: React.ReactNode }) {
  const [statusMap, setStatusMap] = useState<Map<string, SpecStatus>>(new Map());

  const getStatus = useCallback(
    (pathOrSlug: string): SpecStatus => statusMap.get(pathOrSlug) ?? "Draft",
    [statusMap]
  );

  const updateSpecStatus = useCallback((pathOrSlug: string, status: SpecStatus) => {
    setStatusMap((prev) => {
      if (prev.get(pathOrSlug) === status) return prev;
      const next = new Map(prev);
      next.set(pathOrSlug, status);
      return next;
    });
  }, []);

  const preloadStatuses = useCallback((statuses: Record<string, SpecStatus>) => {
    setStatusMap((prev) => {
      const next = new Map(prev);
      for (const [path, status] of Object.entries(statuses)) {
        next.set(path, status);
      }
      return next;
    });
  }, []);

  return (
    <SpecStatusContext.Provider value={{ getStatus, updateSpecStatus, preloadStatuses }}>
      {children}
    </SpecStatusContext.Provider>
  );
}

export function useSpecStatus() {
  return useContext(SpecStatusContext);
}

export const STATUS_DOT: Record<SpecStatus, string> = {
  Draft: "bg-gray-300",
  "In review": "bg-amber-400",
  Reviewed: "bg-green-500",
};
