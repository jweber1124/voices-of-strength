'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

// Shared state for which helper cards are expanded. Lives at the dashboard
// level so the task panel can tell the helpers panel to expand a specific
// card (when the manager taps a helper-name pill on a category).

type Ctx = {
  expandedIds: Set<string>;
  toggle: (id: string) => void;
  expand: (id: string) => void;
};

const HelperFocusContext = createContext<Ctx | null>(null);

export function useHelperFocus() {
  const ctx = useContext(HelperFocusContext);
  if (!ctx) {
    throw new Error('useHelperFocus must be used inside <HelperFocusProvider>');
  }
  return ctx;
}

export function HelperFocusProvider({ children }: { children: ReactNode }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expand(id: string) {
    setExpandedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return (
    <HelperFocusContext.Provider value={{ expandedIds, toggle, expand }}>
      {children}
    </HelperFocusContext.Provider>
  );
}
