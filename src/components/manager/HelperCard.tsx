import { CATEGORIES } from '@/lib/categories';

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

export function HelperCard({ volunteer }: { volunteer: Volunteer }) {
  const name = `${volunteer.first_name} ${volunteer.last_name}`;
  const time =
    volunteer.arrival_time && volunteer.departure_time
      ? `${formatTime(volunteer.arrival_time)} – ${formatTime(volunteer.departure_time)}`
      : null;
  const categoryLabels = volunteer.categories
    .map((id) => CATEGORIES.find((c) => c.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-medium">{name}</div>
        {time && (
          <div className="text-xs text-zinc-500 shrink-0 tabular-nums">{time}</div>
        )}
      </div>

      {categoryLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {categoryLabels.map((label) => (
            <span
              key={label}
              className="text-xs rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300"
            >
              {label}
            </span>
          ))}
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
          <div className="flex items-center gap-2 min-w-0">
            <a
              href={`mailto:${volunteer.email}?subject=${encodeURIComponent('Voices of Strength Open Mic')}`}
              className="text-zinc-300 hover:text-zinc-100 underline-offset-2 hover:underline truncate"
              title="Open in your default mail app"
            >
              {volunteer.email}
            </a>
            <a
              href={
                `https://mail.google.com/mail/?view=cm&fs=1` +
                `&to=${encodeURIComponent(volunteer.email)}` +
                `&su=${encodeURIComponent('Voices of Strength Open Mic')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              title="Open directly in Gmail web"
              className="shrink-0 text-xs text-zinc-500 hover:text-zinc-200 underline-offset-2 hover:underline"
            >
              Gmail
            </a>
          </div>
        )}
      </div>

      {volunteer.note && (
        <div className="mt-3 text-xs text-zinc-400 italic border-l-2 border-zinc-700 pl-2 break-words">
          {volunteer.note}
        </div>
      )}
    </div>
  );
}
