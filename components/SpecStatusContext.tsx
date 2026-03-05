"use client";

import { createContext, useCallback, useContext, useState } from "react";

type SpecStatus = "Draft" | "In review" | "Reviewed";

interface SpecStatusContextValue {
  getStatus: (slug: string) => SpecStatus;
  updateSpecStatus: (slug: string, status: SpecStatus) => void;
}

const SpecStatusContext = createContext<SpecStatusContextValue>({
  getStatus: () => "Draft",
  updateSpecStatus: () => {},
});

export function SpecStatusProvider({ children }: { children: React.ReactNode }) {
  const [statusMap, setStatusMap] = useState<Map<string, SpecStatus>>(new Map());

  const getStatus = useCallback(
    (slug: string): SpecStatus => statusMap.get(slug) ?? "Draft",
    [statusMap]
  );

  const updateSpecStatus = useCallback((slug: string, status: SpecStatus) => {
    setStatusMap((prev) => {
      if (prev.get(slug) === status) return prev;
      const next = new Map(prev);
      next.set(slug, status);
      return next;
    });
  }, []);

  return (
    <SpecStatusContext.Provider value={{ getStatus, updateSpecStatus }}>
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
