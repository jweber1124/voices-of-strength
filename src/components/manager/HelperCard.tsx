'use client';

import { TASK_CATEGORIES } from '@/lib/task-categories';
import { needsConfirmation } from '@/lib/category-rules';
import { useHelperFocus } from './HelperFocusContext';

export type Volunteer = {
  id: string;
  first_name: string;
  last_name: string;
  arrival_time: string | null;
  departure_time: string | null;
  cell: string | null;
  email: string | null;
  categories: string[];
  note: string | null;
};

type Props = {
  volunteer: Volunteer;
  assignedCategoryIds: string[];
};

function formatTime(t: string | null): string {
  if (!t) return '';
  const [hh, mm] = t.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return t;
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${mm.toString().padStart(2, '0')} ${period}`;
}

// Compact summary card. Tap anywhere on it → opens the detail sheet via the
// shared HelperFocus context. Tasks list never scrolls.
export function HelperCard({ volunteer, assignedCategoryIds }: Props) {
  const { setFocused } = useHelperFocus();

  const name = `${volunteer.first_name} ${volunteer.last_name}`;
  const time =
    volunteer.arrival_time && volunteer.departure_time
      ? `${formatTime(volunteer.arrival_time)} – ${formatTime(volunteer.departure_time)}`
      : null;

  const hasGeneral = volunteer.categories.includes('general');
  const specificPrefs = volunteer.categories.filter((c) => c !== 'general');
  const rolesUnion = new Set<string>([...specificPrefs, ...assignedCategoryIds]);
  const orderedRoles = TASK_CATEGORIES.filter((c) => rolesUnion.has(c.id));

  return (
    <button
      type="button"
      onClick={() => setFocused(volunteer.id)}
      id={`helper-${volunteer.id}`}
      className="w-full text-left rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 active:bg-zinc-800/60 active:scale-[0.99] transition-all"
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-medium">{name}</div>
        {time && (
          <div className="text-xs text-zinc-500 shrink-0 tabular-nums">
            {time}
          </div>
        )}
      </div>

      {hasGeneral && (
        <div className="mt-2">
          <span className="text-xs rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-200 px-2 py-0.5">
            General event support
          </span>
        </div>
      )}

      {orderedRoles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {orderedRoles.map((cat) => {
            const isAssigned = assignedCategoryIds.includes(cat.id);
            const isUnconfirmed =
              isAssigned && needsConfirmation(cat.id, volunteer.categories);
            let pillClass = 'text-xs rounded-full px-2 py-0.5 ';
            if (isUnconfirmed) {
              pillClass += 'bg-red-500/15 border border-red-500/40 text-red-200';
            } else if (isAssigned) {
              pillClass +=
                'bg-emerald-500/20 border border-emerald-500/50 text-emerald-100 font-medium';
            } else {
              pillClass += 'bg-zinc-800 border border-zinc-700 text-zinc-300';
            }
            return (
              <span key={cat.id} className={pillClass}>
                {cat.name}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}
