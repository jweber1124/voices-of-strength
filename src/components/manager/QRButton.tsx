'use client';

import { useState, useEffect } from 'react';

type Props = {
  url: string;
  label: string;
  buttonText?: string;
};

export function QRButton({ url, label, buttonText = 'QR' }: Props) {
  const [open, setOpen] = useState(false);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=400x400&margin=20`;

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 px-3 py-1.5 hover:bg-zinc-700 transition-colors"
      >
        {buttonText}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900 mb-3">{label}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt={`QR code for ${label}`}
              width={300}
              height={300}
              className="mx-auto"
            />
            <p className="mt-3 text-xs text-zinc-500 break-all">{url}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 rounded-lg bg-zinc-900 text-white px-5 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
