'use client';

import { useState, useTransition } from 'react';
import { extendSession } from '@/lib/manager-auth';

export function ExtendSessionButton() {
  const [pending, startTransition] = useTransition();
  const [justExtended, setJustExtended] = useState(false);

  function handleClick() {
    startTransition(async () => {
      await extendSession();
      setJustExtended(true);
      setTimeout(() => setJustExtended(false), 5000);
    });
  }

  if (justExtended) {
    return (
      <div className="text-sm rounded-full bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 px-3.5 py-1.5 font-medium shrink-0">
        Session extended for 8 hours
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title="Extend your session to 8 hours from now"
      className="text-sm rounded-full border border-zinc-600 bg-zinc-900 text-zinc-100 px-3.5 py-1.5 font-medium hover:bg-zinc-800 hover:border-zinc-500 active:scale-95 transition-all disabled:opacity-50 shrink-0"
    >
      {pending ? 'Extending…' : 'Stay logged in 8h'}
    </button>
  );
}
