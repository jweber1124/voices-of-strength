import { supabase } from '@/lib/supabase';

export default async function Home() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'current');

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl font-semibold mb-6">
        Voices of Strength — connection test
      </h1>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Connection failed</p>
          <p className="mt-1 text-sm">{error.message}</p>
        </div>
      ) : events && events.length > 0 ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-800">Connected to Supabase</p>
          <p className="mt-2 text-sm text-zinc-700">Current event:</p>
          <pre className="mt-2 p-3 bg-white rounded border border-zinc-200 text-xs overflow-auto">
            {JSON.stringify(events[0], null, 2)}
          </pre>
        </div>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Connected, but no current event found.
        </div>
      )}
    </main>
  );
}
