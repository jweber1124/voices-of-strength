'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

// Tracks which helper is currently being "focused" (i.e. shown in the detail
// sheet). One at a time. Lifted to the dashboard so both the task panel and
// the helpers panel can trigger it.

type Ctx = {
  focusedId: string | null;
  setFocused: (id: string | null) => void;
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
  const [focusedId, setFocused] = useState<string | null>(null);
  return (
    <HelperFocusContext.Provider value={{ focusedId, setFocused }}>
      {children}
    </HelperFocusContext.Provider>
  );
}
