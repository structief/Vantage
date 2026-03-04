"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Mode = "expanded" | "collapsed";

const STORAGE_KEY = "vantage:secondary-sidebar:mode";

interface SidebarModeContextValue {
  mode: Mode;
  toggleMode: () => void;
}

const SidebarModeContext = createContext<SidebarModeContextValue>({
  mode: "expanded",
  toggleMode: () => {},
});

export function useSidebarMode() {
  return useContext(SidebarModeContext);
}

export function SidebarModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("expanded");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "collapsed" || stored === "expanded") {
      setMode(stored);
    }
  }, []);

  const toggleMode = () => {
    setMode((prev) => {
      const next: Mode = prev === "expanded" ? "collapsed" : "expanded";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <SidebarModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </SidebarModeContext.Provider>
  );
}
