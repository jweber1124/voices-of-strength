import { supabase } from '@/lib/supabase';
import { SignupForm } from '@/components/SignupForm';

type PageProps = {
  searchParams: Promise<{ volunteerId?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
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
        // Postgres TIME returns "HH:MM:SS"; HTML time inputs want "HH:MM"
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
    <main className="min-h-screen bg-zinc-950 py-10 px-4 text-zinc-100">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Voices of Strength Open Mic
          </h1>
          <p className="mt-2 text-zinc-400">
            {initial ? 'Edit your sign-up' : 'Volunteer sign-up'}
            {event?.name ? ` — ${event.name}` : ''}
          </p>
        </header>

        <SignupForm counts={counts} initial={initial} />
      </div>
    </main>
  );
}
