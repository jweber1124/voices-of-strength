import { TASK_CATEGORIES } from '@/lib/task-categories';
import { needsConfirmation } from '@/lib/category-rules';
import { ConfirmAssignmentButton } from './ConfirmAssignmentButton';

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

function formatCell(cell: string): string {
  const digits = cell.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return cell;
}

export function HelperCard({ volunteer, assignedCategoryIds }: Props) {
  const name = `${volunteer.first_name} ${volunteer.last_name}`;
  const time =
    volunteer.arrival_time && volunteer.departure_time
      ? `${formatTime(volunteer.arrival_time)} – ${formatTime(volunteer.departure_time)}`
      : null;

  const hasGeneral = volunteer.categories.includes('general');
  const taskCatLookup = new Map(TASK_CATEGORIES.map((c) => [c.id, c]));

  // Union of specific preferences (excluding general) and current assignments,
  // ordered by the canonical task-category order.
  const specificPrefs = volunteer.categories.filter((c) => c !== 'general');
  const rolesUnion = new Set<string>([...specificPrefs, ...assignedCategoryIds]);
  const orderedRoles = TASK_CATEGORIES.filter((c) => rolesUnion.has(c.id));

  const unconfirmed = assignedCategoryIds.filter((catId) =>
    needsConfirmation(catId, volunteer.categories),
  );

  return (
    <div
      id={`helper-${volunteer.id}`}
      className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-shadow scroll-mt-6"
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-medium">{name}</div>
        {time && (
          <div className="text-xs text-zinc-500 shrink-0 tabular-nums">{time}</div>
        )}
      </div>

      {hasGeneral && (
        <div className="mt-2">
          <span
            className="text-xs rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-200 px-2 py-0.5"
            title="Flexible — available for any in-event role"
          >
            General event support
          </span>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1 text-sm">
        {volunteer.cell && (
          <a
            href={`tel:${volunteer.cell.replace(/\D/g, '')}`}
            className="text-zinc-300 hover:text-zinc-100 underline-offset-2 hover:underline tabular-nums w-fit"
          >
            {formatCell(volunteer.cell)}
          </a>
        )}
        {volunteer.email && (
          <a
            href={`mailto:${volunteer.email}?subject=${encodeURIComponent('Voices of Strength Open Mic')}`}
            className="text-zinc-300 hover:text-zinc-100 underline-offset-2 hover:underline truncate w-fit"
          >
            {volunteer.email}
          </a>
        )}
      </div>

      {orderedRoles.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">
            Roles
          </p>
          <div className="flex flex-wrap gap-1.5">
            {orderedRoles.map((cat) => {
              const isAssigned = assignedCategoryIds.includes(cat.id);
              const isUnconfirmed =
                isAssigned && needsConfirmation(cat.id, volunteer.categories);

              let pillClass = 'text-xs rounded-full px-2 py-0.5 ';
              let pillTitle: string | undefined;
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
        <div className="mt-3 text-xs text-zinc-400 italic border-l-2 border-zinc-700 pl-2 break-words">
          {volunteer.note}
        </div>
      )}
    </div>
  );
}
