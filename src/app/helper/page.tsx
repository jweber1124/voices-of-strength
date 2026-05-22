import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SignupForm } from '@/components/SignupForm';
import { EVENT_DETAILS } from '@/lib/event';

type PageProps = {
  searchParams: Promise<{ volunteerId?: string }>;
};

export default async function HelperPage({ searchParams }: PageProps) {
  const { volunteerId: editingId } = await searchParams;

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'current')
    .limit(1);
  const event = events?.[0];

  const { data: volunteers } = await supabase
    .from('volunteers')
    .select('categories')
    .eq('event_id', event?.id ?? '');

  const counts: Record<string, number> = {};
  for (const v of volunteers ?? []) {
    for (const c of (v.categories ?? []) as string[]) {
      counts[c] = (counts[c] ?? 0) + 1;
    }
  }

  let initial = undefined;
  if (editingId) {
    const { data: vol } = await supabase
      .from('volunteers')
      .select('*')
      .eq('id', editingId)
      .maybeSingle();
    if (vol) {
      initial = {
        id: vol.id as string,
        first_name: vol.first_name as string | null,
        last_name: vol.last_name as string | null,
        arrival_time: vol.arrival_time ? (vol.arrival_time as string).slice(0, 5) : null,
        departure_time: vol.departure_time ? (vol.departure_time as string).slice(0, 5) : null,
        cell: vol.cell as string | null,
        email: vol.email as string | null,
        categories: (vol.categories ?? []) as string[],
        note: vol.note as string | null,
      };
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 py-8 px-4 text-zinc-100">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-block text-sm text-zinc-400 hover:text-zinc-100 active:text-zinc-100 active:scale-95 transition-all"
          >
            ← Volunteer Portal
          </Link>
        </div>

        <header className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Voices of Strength Open Mic
          </h1>
          <p className="mt-2 text-zinc-400">
            {initial ? 'Edit your sign-up' : 'Sign up to help at our next event below'}
          </p>
        </header>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm">
          <p className="font-medium text-zinc-100">{EVENT_DETAILS.date}</p>
          <p className="text-zinc-400 mt-0.5">{EVENT_DETAILS.location.name}</p>
          <p className="text-zinc-400">{EVENT_DETAILS.location.address}</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider">
                Headliner
              </p>
              <p className="text-zinc-200">{EVENT_DETAILS.headliner}</p>
              <p className="text-zinc-400 text-xs tabular-nums">
                {EVENT_DETAILS.times.headliner}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider">
                Open mic
              </p>
              <p className="text-zinc-200 tabular-nums">
                {EVENT_DETAILS.times.openMic}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
            Set-up begins at {EVENT_DETAILS.times.setUpStart}. Clean-up runs
            until ~{EVENT_DETAILS.times.cleanUpEnd}.
          </p>
        </div>

        <SignupForm counts={counts} initial={initial} />
      </div>
    </main>
  );
}
