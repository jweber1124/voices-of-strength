'use client';

import { useState } from 'react';
import { submitSignup } from '@/lib/actions';
import { CATEGORIES } from '@/lib/categories';

type Initial = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  arrival_time?: string | null;
  departure_time?: string | null;
  cell?: string | null;
  email?: string | null;
  categories?: string[] | null;
  note?: string | null;
};

type Props = {
  counts: Record<string, number>;
  initial?: Initial;
};

export function SignupForm({ counts, initial }: Props) {
  const isEdit = Boolean(initial?.id);

  const [firstName, setFirstName] = useState(initial?.first_name ?? '');
  const [lastName, setLastName] = useState(initial?.last_name ?? '');
  const [arrival, setArrival] = useState(initial?.arrival_time ?? '16:00');
  const [departure, setDeparture] = useState(initial?.departure_time ?? '21:30');
  const [cell, setCell] = useState(initial?.cell ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [selectedCats, setSelectedCats] = useState<Set<string>>(
    new Set(initial?.categories ?? []),
  );
  const [note, setNote] = useState(initial?.note ?? '');
  const [categoryError, setCategoryError] = useState('');

  function adjustTime(current: string, deltaMinutes: number): string {
    const [h, m] = current.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return current;
    const total = h * 60 + m + deltaMinutes;
    const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
    const newH = Math.floor(wrapped / 60);
    const newM = wrapped % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  }

  function toggleCategory(id: string) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form
      action={submitSignup}
      onSubmit={(e) => {
        if (selectedCats.size === 0) {
          e.preventDefault();
          setCategoryError('Please select at least one role to help with.');
        } else {
          setCategoryError('');
        }
      }}
      className="space-y-6 bg-zinc-900 rounded-xl border border-zinc-800 p-6"
    >
      {isEdit && initial?.id && (
        <input type="hidden" name="volunteer_id" value={initial.id} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          name="first_name"
          label="First name"
          value={firstName}
          onChange={setFirstName}
          required
        />
        <TextField
          name="last_name"
          label="Last name"
          value={lastName}
          onChange={setLastName}
          required
        />
      </div>

      <div>
        <label className="block font-medium text-zinc-100 mb-2">
          When are you available? <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TimeField
            name="arrival_time"
            label="Arriving at"
            value={arrival}
            onChange={setArrival}
            adjustTime={adjustTime}
          />
          <TimeField
            name="departure_time"
            label="Leaving at"
            value={departure}
            onChange={setDeparture}
            adjustTime={adjustTime}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          name="cell"
          label="Cell phone"
          value={cell}
          onChange={setCell}
          placeholder="555-123-4567"
          required
        />
        <TextField
          name="email"
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          required
        />
      </div>

      <fieldset>
        <legend className="font-medium text-zinc-100">
          Where can you help? <span className="text-red-400">*</span>
        </legend>
        <p className="text-sm text-zinc-400 mt-1 mb-3">
          Check at least one. Counts show how many people have already signed up
          for that role.
        </p>
        {categoryError && (
          <p className="mb-3 text-sm text-red-400">{categoryError}</p>
        )}
        <div className="space-y-2">
          {CATEGORIES.map((cat) => {
            const count = counts[cat.id] ?? 0;
            const checked = selectedCats.has(cat.id);
            return (
              <label
                key={cat.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? 'border-zinc-500 bg-zinc-800'
                    : 'border-zinc-800 hover:bg-zinc-800/50'
                }`}
              >
                <input
                  type="checkbox"
                  name="categories"
                  value={cat.id}
                  checked={checked}
                  onChange={() => toggleCategory(cat.id)}
                  className="mt-1 h-4 w-4 accent-zinc-100"
                />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-zinc-100">{cat.name}</span>
                    <span className="text-sm text-zinc-400 shrink-0">
                      {count} signed up
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">{cat.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="note" className="block font-medium text-zinc-100 mb-1">
          Note for the event manager (optional)
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 250))}
          placeholder="Anything we should know?"
          maxLength={250}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <p className="mt-1 text-xs text-zinc-500 text-right tabular-nums">
          {note.length} / 250
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-100 text-zinc-900 font-medium py-3 hover:bg-white transition-colors"
      >
        {isEdit ? 'Update sign-up' : 'Submit sign-up'}
      </button>
    </form>
  );
}

function TextField({
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block font-medium text-zinc-100 mb-1">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
    </div>
  );
}

function TimeField({
  name,
  label,
  value,
  onChange,
  adjustTime,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  adjustTime: (current: string, deltaMinutes: number) => string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm text-zinc-400 mb-1">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <input
          id={name}
          name={name}
          type="time"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 [color-scheme:dark]"
        />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onChange(adjustTime(value, -15))}
            aria-label="Back 15 minutes"
            className="px-2 text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 leading-none py-1"
          >
            −15
          </button>
          <button
            type="button"
            onClick={() => onChange(adjustTime(value, 15))}
            aria-label="Forward 15 minutes"
            className="px-2 text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 leading-none py-1"
          >
            +15
          </button>
        </div>
      </div>
    </div>
  );
}
