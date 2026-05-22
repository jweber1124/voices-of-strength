'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useHelperFocus } from './HelperFocusContext';
import { TASK_CATEGORIES } from '@/lib/task-categories';
import { needsConfirmation } from '@/lib/category-rules';
import { ConfirmAssignmentButton } from './ConfirmAssignmentButton';
import type { Volunteer } from './HelperCard';

type Props = {
  helpers: Volunteer[];
  assignmentsByVolunteer: Record<string, string[]>;
};

function formatTime(t: string | null): string {
  if (!t) return '';
  const [hh, mm] = t.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return t;
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${mm.toString().padStart(2, '0')} ${period}`;
}

function formatCell(cell: string): string {
  const digits = cell.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return cell;
}

export function HelperDetailSheet({ helpers, assignmentsByVolunteer }: Props) {
  const { focusedId, setFocused } = useHelperFocus();
  const volunteer = focusedId
    ? helpers.find((h) => h.id === focusedId) ?? null
    : null;

  // Escape closes the sheet.
  useEffect(() => {
    if (!volunteer) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFocused(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [volunteer, setFocused]);

  // Lock body scroll while sheet is open so the underlying page can't drift.
  useEffect(() => {
    if (!volunteer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [volunteer]);

  return (
    <AnimatePresence>
      {volunteer && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setFocused(null)}
        >
          <motion.div
            key="sheet"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-full sm:max-w-md bg-zinc-900 border-t border-zinc-800 rounded-t-2xl sm:rounded-2xl sm:border sm:m-4 max-h-[85vh] overflow-y-auto text-zinc-100"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <SheetContent
              volunteer={volunteer}
              assignedCategoryIds={assignmentsByVolunteer[volunteer.id] ?? []}
              onClose={() => setFocused(null)}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SheetContent({
  volunteer,
  assignedCategoryIds,
  onClose,
}: {
  volunteer: Volunteer;
  assignedCategoryIds: string[];
  onClose: () => void;
}) {
  const name = `${volunteer.first_name} ${volunteer.last_name}`;
  const time =
    volunteer.arrival_time && volunteer.departure_time
      ? `${formatTime(volunteer.arrival_time)} – ${formatTime(volunteer.departure_time)}`
      : null;

  const hasGeneral = volunteer.categories.includes('general');
  const taskCatLookup = new Map(TASK_CATEGORIES.map((c) => [c.id, c]));

  const specificPrefs = volunteer.categories.filter((c) => c !== 'general');
  const rolesUnion = new Set<string>([...specificPrefs, ...assignedCategoryIds]);
  const orderedRoles = TASK_CATEGORIES.filter((c) => rolesUnion.has(c.id));

  const unconfirmed = assignedCategoryIds.filter((catId) =>
    needsConfirmation(catId, volunteer.categories),
  );

  return (
    <div className="p-5">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700 sm:hidden" />

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">{name}</div>
          {time && (
            <div className="text-sm text-zinc-400 tabular-nums mt-0.5">
              {time}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-zinc-400 hover:text-zinc-100 active:scale-90 transition-all text-2xl leading-none px-2 -mr-2"
        >
          ×
        </button>
      </div>

      {hasGeneral && (
        <div className="mt-3">
          <span
            className="text-xs rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-200 px-2 py-0.5"
            title="Flexible — available for any in-event role"
          >
            General event support
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-1.5 text-sm">
        {volunteer.cell && (
          <a
            href={`tel:${volunteer.cell.replace(/\D/g, '')}`}
            className="text-zinc-200 hover:text-white underline-offset-2 hover:underline tabular-nums w-fit"
          >
            {formatCell(volunteer.cell)}
          </a>
        )}
        {volunteer.email && (
          <a
            href={`mailto:${volunteer.email}?subject=${encodeURIComponent('Voices of Strength Open Mic')}`}
            className="text-zinc-200 hover:text-white underline-offset-2 hover:underline truncate w-fit"
          >
            {volunteer.email}
          </a>
        )}
      </div>

      {orderedRoles.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">
            Roles
          </p>
          <div className="flex flex-wrap gap-1.5">
            {orderedRoles.map((cat) => {
              const isAssigned = assignedCategoryIds.includes(cat.id);
              const isUnconfirmed =
                isAssigned && needsConfirmation(cat.id, volunteer.categories);
              let pillClass = 'text-xs rounded-full px-2 py-0.5 ';
              let pillTitle: string;
              if (isUnconfirmed) {
                pillClass +=
                  'bg-red-500/15 border border-red-500/40 text-red-200';
                pillTitle = 'Assigned but availability not confirmed';
              } else if (isAssigned) {
                pillClass +=
                  'bg-emerald-500/20 border border-emerald-500/50 text-emerald-100 font-medium';
                pillTitle = 'Assigned';
              } else {
                pillClass +=
                  'bg-zinc-800 border border-zinc-700 text-zinc-300';
                pillTitle = 'Signed up but not yet assigned';
              }
              return (
                <span key={cat.id} className={pillClass} title={pillTitle}>
                  {cat.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {unconfirmed.map((catId) => {
        const cat = taskCatLookup.get(catId);
        if (!cat) return null;
        return (
          <ConfirmAssignmentButton
            key={catId}
            volunteerId={volunteer.id}
            categoryId={catId}
            categoryName={cat.name}
          />
        );
      })}

      {volunteer.note && (
        <div className="mt-4 text-sm text-zinc-300 italic border-l-2 border-zinc-700 pl-3 break-words">
          {volunteer.note}
        </div>
      )}
    </div>
  );
}
