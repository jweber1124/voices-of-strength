import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TASK_CATEGORIES } from '@/lib/task-categories';
import { HelperCard, type Volunteer } from '@/components/manager/HelperCard';
import { TaskCategoryCard } from '@/components/manager/TaskCategoryCard';
import { HelperFocusProvider } from '@/components/manager/HelperFocusContext';
import { HelperDetailSheet } from '@/components/manager/HelperDetailSheet';
import { logout } from '@/lib/manager-auth';
import { ExtendSessionButton } from '@/components/manager/ExtendSessionButton';
import { QRButton } from '@/components/manager/QRButton';
import { EVENT_DETAILS } from '@/lib/event';

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
  const assignmentsByVolunteer: Record<string, string[]> = {};
  for (const a of assignmentsRes.data ?? []) {
    const cat = a.category_id as string;
    const vol = a.volunteer_id as string;
    if (!assignmentsByCategory[cat]) assignmentsByCategory[cat] = [];
    assignmentsByCategory[cat].push(vol);
    if (!assignmentsByVolunteer[vol]) assignmentsByVolunteer[vol] = [];
    assignmentsByVolunteer[vol].push(cat);
  }

  const volunteerSummaries = volunteers.map((v) => ({
    id: v.id,
    first_name: v.first_name,
    last_name: v.last_name,
    categories: v.categories,
  }));

  return (
    <main className="min-h-screen bg-zinc-950 py-8 px-4 text-zinc-100">
      <div className="max-w-7xl mx-auto">
        <Header eventName={event.name} volunteerCount={volunteers.length} />

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Event details
            </p>
            <p className="font-medium text-zinc-100">{EVENT_DETAILS.date}</p>
            <p className="text-zinc-400">{EVENT_DETAILS.location.name}</p>
            <p className="text-zinc-400">{EVENT_DETAILS.location.address}</p>

            <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-baseline">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Headliner</span>
              <span className="text-zinc-200">
                {EVENT_DETAILS.headliner}
                <span className="text-zinc-400 tabular-nums"> · {EVENT_DETAILS.times.headliner}</span>
              </span>

              <span className="text-xs text-zinc-500 uppercase tracking-wider">Open mic</span>
              <span className="text-zinc-200 tabular-nums">{EVENT_DETAILS.times.openMic}</span>

              <span className="text-xs text-zinc-500 uppercase tracking-wider">Set-up</span>
              <span className="text-zinc-200 tabular-nums">{EVENT_DETAILS.times.setUpStart}</span>

              <span className="text-xs text-zinc-500 uppercase tracking-wider">Clean-up</span>
              <span className="text-zinc-200 tabular-nums">ends at {EVENT_DETAILS.times.cleanUpEnd}</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Resources
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-300 mb-2">Performer sign-up form</p>
                <div className="flex gap-2">
                  <a
                    href={EVENT_DETAILS.urls.performerSignup}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 px-3 py-1.5 hover:bg-zinc-700 active:bg-zinc-700 active:scale-95 transition-all"
                  >
                    Open form
                  </a>
                  <QRButton url={EVENT_DETAILS.urls.performerSignup} label="Performer sign-up form" />
                </div>
              </div>

              <div>
                <p className="text-sm text-zinc-300 mb-2">Eventbrite event</p>
                <div className="flex gap-2">
                  <a
                    href={EVENT_DETAILS.urls.eventbrite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 px-3 py-1.5 hover:bg-zinc-700 active:bg-zinc-700 active:scale-95 transition-all"
                  >
                    Open page
                  </a>
                  <QRButton url={EVENT_DETAILS.urls.eventbrite} label="Eventbrite event" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <HelperFocusProvider>
        <HelperDetailSheet
          helpers={volunteers}
          assignmentsByVolunteer={assignmentsByVolunteer}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4 order-2 lg:order-1 min-w-0">
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

          <aside className="space-y-3 order-1 lg:order-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Helpers ({volunteers.length})
              </h2>
              {volunteers.some((v) => v.email) && (
                <EmailAllHelpersLink volunteers={volunteers} />
              )}
            </div>
            {volunteers.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
                No helpers signed up yet.
              </div>
            ) : (
              volunteers.map((v) => (
                <HelperCard
                  key={v.id}
                  volunteer={v}
                  assignedCategoryIds={assignmentsByVolunteer[v.id] ?? []}
                />
              ))
            )}
          </aside>
        </div>
        </HelperFocusProvider>
      </div>
    </main>
  );
}

function EmailAllHelpersLink({ volunteers }: { volunteers: Volunteer[] }) {
  const emails = volunteers
    .map((v) => v.email)
    .filter((e): e is string => Boolean(e));
  if (emails.length === 0) return null;

  const subject = 'Voices of Strength Open Mic';
  const ccList = EVENT_DETAILS.ccEmails.join(',');
  const toList = emails.join(',');

  const mailtoHref = `mailto:${toList}?cc=${ccList}&subject=${encodeURIComponent(subject)}`;
  const gmailHref =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(toList)}` +
    `&cc=${encodeURIComponent(ccList)}` +
    `&su=${encodeURIComponent(subject)}`;

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={mailtoHref}
        title="Open in your default mail app"
        className="text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 px-2.5 py-1 hover:bg-zinc-700 active:bg-zinc-700 active:scale-95 transition-all"
      >
        Email all
      </a>
      <a
        href={gmailHref}
        target="_blank"
        rel="noopener noreferrer"
        title="Open directly in Gmail web"
        className="hidden sm:inline-block text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 px-2.5 py-1 hover:bg-zinc-700 active:bg-zinc-700 active:scale-95 transition-all"
      >
        via Gmail
      </a>
    </div>
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
    <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Manager dashboard
        </h1>
        <p className="text-zinc-400 mt-1">
          {eventName} · {volunteerCount}{' '}
          {volunteerCount === 1 ? 'helper' : 'helpers'} signed up
        </p>
      </div>
      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap sm:shrink-0">
        <ExtendSessionButton />
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-zinc-100 active:text-zinc-100 active:scale-95 transition-all"
        >
          ← Portal
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-zinc-400 hover:text-zinc-100 active:text-zinc-100 active:scale-95 transition-all"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
