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
          Your sign-up has been received. We&apos;ll see you at the event.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {volunteerId && (
            <Link
              href={`/?volunteerId=${volunteerId}`}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              Edit sign-up
            </Link>
          )}
          <Link
            href="/"
            className="rounded-lg bg-zinc-100 text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-white transition-colors"
          >
            Register another helper
          </Link>
        </div>
      </div>
    </main>
  );
}
