import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cancelSignup } from '@/lib/actions';
import { EVENT_DETAILS } from '@/lib/event';
import { SubmitButton } from '@/components/SubmitButton';

type Props = {
  searchParams: Promise<{ volunteerId?: string; status?: string }>;
};

export default async function CancelPage({ searchParams }: Props) {
  const { volunteerId, status } = await searchParams;

  // ---------- Done state (after a successful cancellation) ----------
  if (status === 'done') {
    return (
      <Wrap>
        <h1 className="text-2xl font-semibold mb-3">Sign-up canceled</h1>
        <p className="text-zinc-400 mb-6">
          Your sign-up has been canceled and the event team has been notified.
          We hope to see you at a future event.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all"
          >
            Back to portal
          </Link>
          <Link
            href="/helper"
            className="rounded-lg bg-zinc-100 text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-white active:bg-zinc-300 active:scale-95 transition-all"
          >
            Sign up again
          </Link>
        </div>
      </Wrap>
    );
  }

  // ---------- Bad link ----------
  if (!volunteerId) {
    return (
      <Wrap>
        <h1 className="text-2xl font-semibold mb-3">Invalid link</h1>
        <p className="text-zinc-400 mb-6">
          We couldn&apos;t find a sign-up to cancel. Try the cancel link in
          your confirmation email.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all"
        >
          Back to portal
        </Link>
      </Wrap>
    );
  }

  // ---------- Look up the volunteer ----------
  const { data: vol } = await supabase
    .from('volunteers')
    .select('first_name, last_name')
    .eq('id', volunteerId)
    .maybeSingle();

  if (!vol) {
    return (
      <Wrap>
        <h1 className="text-2xl font-semibold mb-3">Sign-up not found</h1>
        <p className="text-zinc-400 mb-6">
          This sign-up has already been canceled or removed. Nothing to do here.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all"
        >
          Back to portal
        </Link>
      </Wrap>
    );
  }

  const fullName = `${vol.first_name} ${vol.last_name}`.trim();

  // ---------- Confirm prompt ----------
  return (
    <Wrap>
      <h1 className="text-2xl font-semibold mb-3">Cancel sign-up?</h1>
      <p className="text-zinc-300 mb-2">
        You&apos;re about to cancel <strong>{fullName}</strong>&apos;s sign-up
        for the Voices of Strength Open Mic on {EVENT_DETAILS.date}.
      </p>
      <p className="text-zinc-500 text-sm mb-6">
        The event team will be notified, and you can always sign up again later.
      </p>
      <form action={cancelSignup}>
        <input type="hidden" name="volunteer_id" value={volunteerId} />
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/helper"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all"
          >
            Never mind
          </Link>
          <SubmitButton
            className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-500 active:bg-red-700 active:scale-95 transition-all"
            pendingChildren="Canceling…"
          >
            Yes, cancel my sign-up
          </SubmitButton>
        </div>
      </form>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-950 py-10 px-4 flex items-center justify-center text-zinc-100">
      <div className="max-w-md w-full bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
        {children}
      </div>
    </main>
  );
}
