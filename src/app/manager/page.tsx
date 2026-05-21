import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TASK_CATEGORIES } from '@/lib/task-categories';
import { HelperCard, type Volunteer } from '@/components/manager/HelperCard';
import { TaskCategoryCard } from '@/components/manager/TaskCategoryCard';
import { logout } from '@/lib/manager-auth';
import { ExtendSessionButton } from '@/components/manager/ExtendSessionButton';

export default async function ManagerHome() {
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('status', 'current')
    .limit(1);
  const event = events?.[0];

  if (!event) {
    return (
      <main className="min-h-screen bg-zinc-950 py-10 px-4 text-zinc-100">
        <div className="max-w-7xl mx-auto">
          <Header eventName="No current event" volunteerCount={0} />
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
            No current event found. Create one in Supabase to get started.
          </div>
        </div>
      </main>
    );
  }

  const [volunteersRes, completionsRes, assignmentsRes] = await Promise.all([
    supabaseAdmin
      .from('volunteers')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('sub_task_completions')
      .select('*')
      .eq('event_id', event.id),
    supabaseAdmin
      .from('category_assignments')
      .select('*')
      .eq('event_id', event.id),
  ]);

  const volunteers: Volunteer[] = (volunteersRes.data ?? []).map((v) => ({
    id: v.id as string,
    first_name: v.first_name as string,
    last_name: v.last_name as string,
    // Postgres TIME returns "HH:MM:SS"; UI expects "HH:MM" (or null)
    arrival_time: v.arrival_time ? (v.arrival_time as string).slice(0, 5) : null,
    departure_time: v.departure_time ? (v.departure_time as string).slice(0, 5) : null,
    cell: (v.cell as string | null) ?? null,
    email: (v.email as string | null) ?? null,
    categories: (v.categories ?? []) as string[],
    note: (v.note as string | null) ?? null,
  }));

  const completedSubTaskIds = (completionsRes.data ?? [])
    .filter((c) => c.is_complete)
    .map((c) => c.sub_task_id as string);

  const assignmentsByCategory: Record<string, string[]> = {};
  for (const a of assignmentsRes.data ?? []) {
    const cat = a.category_id as string;
    const vol = a.volunteer_id as string;
    if (!assignmentsByCategory[cat]) assignmentsByCategory[cat] = [];
    assignmentsByCategory[cat].push(vol);
  }

  const volunteerSummaries = volunteers.map((v) => ({
    id: v.id,
    first_name: v.first_name,
    last_name: v.last_name,
  }));

  return (
    <main className="min-h-screen bg-zinc-950 py-8 px-4 text-zinc-100">
      <div className="max-w-7xl mx-auto">
        <Header eventName={event.name} volunteerCount={volunteers.length} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
            {TASK_CATEGORIES.map((category) => (
              <TaskCategoryCard
                key={category.id}
                eventId={event.id}
                category={category}
                completedSubTaskIds={completedSubTaskIds}
                assignedVolunteerIds={assignmentsByCategory[category.id] ?? []}
                allVolunteers={volunteerSummaries}
              />
            ))}
          </div>

          <aside className="space-y-3 order-1 lg:order-2">
            <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Helpers ({volunteers.length})
            </h2>
            {volunteers.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
                No helpers signed up yet.
              </div>
            ) : (
              volunteers.map((v) => <HelperCard key={v.id} volunteer={v} />)
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Header({
  eventName,
  volunteerCount,
}: {
  eventName: string;
  volunteerCount: number;
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Manager dashboard
        </h1>
        <p className="text-zinc-400 mt-1">
          {eventName} · {volunteerCount}{' '}
          {volunteerCount === 1 ? 'helper' : 'helpers'} signed up
        </p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <ExtendSessionButton />
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          ← Portal
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
