'use client';

import { useTransition } from 'react';
import { confirmAssignment } from '@/lib/manager-actions';

type Props = {
  volunteerId: string;
  categoryId: string;
  categoryName: string;
};

export function ConfirmAssignmentButton({
  volunteerId,
  categoryId,
  categoryName,
}: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await confirmAssignment(volunteerId, categoryId);
    });
  }

  return (
    <div className="mt-2 rounded-md border border-red-500/40 bg-red-500/10 p-2.5">
      <p className="text-xs text-red-200">
        Confirm availability for{' '}
        <span className="font-medium">{categoryName}</span>
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="mt-2 rounded-md bg-red-500/30 hover:bg-red-500/40 text-red-50 px-2.5 py-1 text-xs font-medium disabled:opacity-50 transition-colors"
      >
        {pending ? 'Confirming…' : 'Confirmed with helper'}
      </button>
    </div>
  );
}
