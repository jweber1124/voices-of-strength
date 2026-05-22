import Link from 'next/link';
import { login } from '@/lib/manager-auth';
import { SubmitButton } from '@/components/SubmitButton';

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function ManagerLoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;

  return (
    <main className="min-h-screen bg-zinc-950 py-10 px-4 flex items-center justify-center text-zinc-100">
      <div className="max-w-sm w-full">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-block text-sm text-zinc-400 hover:text-zinc-100 active:text-zinc-100 active:scale-95 transition-all"
          >
            ← Volunteer Portal
          </Link>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
        <h1 className="text-2xl font-semibold text-center mb-1">Manager</h1>
        <p className="text-sm text-zinc-400 text-center mb-6">
          Voices of Strength Open Mic
        </p>

        <form action={login} className="space-y-4">
          {next && <input type="hidden" name="next" value={next} />}

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">Incorrect password. Try again.</p>
          )}

          <SubmitButton
            className="w-full rounded-lg bg-zinc-100 text-zinc-900 font-medium py-2.5 hover:bg-white active:bg-zinc-300 active:scale-[0.98] transition-all"
            pendingChildren="Signing in…"
          >
            Sign in
          </SubmitButton>
        </form>
        </div>
      </div>
    </main>
  );
}
