import Link from 'next/link';

type Props = {
  searchParams: Promise<{ volunteerId?: string }>;
};

export default async function ThankYou({ searchParams }: Props) {
  const { volunteerId } = await searchParams;

  return (
    <main className="min-h-screen bg-zinc-950 py-10 px-4 flex items-center justify-center text-zinc-100">
      <div className="max-w-md w-full bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
        <h1 className="text-2xl font-semibold mb-3">Thank you!</h1>
        <p className="text-zinc-400 mb-6">
          A confirmation email is on its way with event details and a private
          link to update your availability if anything changes. You can also
          edit your sign-up right now below.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {volunteerId && (
            <Link
              href={`/helper?volunteerId=${volunteerId}`}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all"
            >
              Edit sign-up
            </Link>
          )}
          <Link
            href="/helper"
            className="rounded-lg bg-zinc-100 text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-white active:bg-zinc-300 active:scale-95 transition-all"
          >
            Register another helper
          </Link>
        </div>
      </div>
    </main>
  );
}
