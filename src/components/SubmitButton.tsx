'use client';

import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  pendingChildren?: ReactNode;
  className?: string;
};

// Wraps useFormStatus so a button inside a <form action={serverAction}> shows
// a pending state while the action is running. Without this, server-action
// submits feel unresponsive because the press feedback ends before the
// network round-trip completes.
export function SubmitButton({ children, pendingChildren, className = '' }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:opacity-70 disabled:cursor-wait`}
    >
      {pending ? (pendingChildren ?? children) : children}
    </button>
  );
}
