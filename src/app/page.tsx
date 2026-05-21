import Link from 'next/link';
import { EVENT_DETAILS } from '@/lib/event';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 py-12 px-4 flex items-center justify-center text-zinc-100">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Voices of Strength Open Mic
        </h1>
        <p className="mt-1 text-lg text-zinc-300">Volunteer Portal</p>
        <p className="mt-4 text-zinc-400">
          Volunteer at our event on {EVENT_DETAILS.date}
        </p>

        <p className="mt-10 text-zinc-300">
          Are you here to manage the event or sign up to help?
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/manager"
            className="rounded-lg border border-zinc-700 px-5 py-3 font-medium hover:bg-zinc-900 transition-colors"
          >
            Manage
          </Link>
          <Link
            href="/helper"
            className="rounded-lg bg-zinc-100 text-zinc-900 px-5 py-3 font-medium hover:bg-white transition-colors"
          >
            Help
          </Link>
        </div>
      </div>
    </main>
  );
}
