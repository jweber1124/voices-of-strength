'use client';

type Props = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  value?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

// A consistently-styled checkbox. The native input is positioned over the
// visual but transparent, so taps go through to the real <input> (which the
// form / React state can read), and the visual is fully under our control.
// Avoids the mobile-browser quirk where native checkboxes render nearly
// invisibly inside a dark form.
export function Checkbox({
  checked,
  onChange,
  name,
  value,
  disabled,
  size = 'md',
  className = '',
}: Props) {
  const box = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <span
      className={`relative inline-flex ${box} shrink-0 items-center justify-center rounded border-2 transition-all active:scale-90 ${
        checked
          ? 'bg-zinc-100 border-zinc-100'
          : 'border-zinc-500 bg-zinc-800'
      } ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        name={name}
        value={value}
        disabled={disabled}
        className="absolute inset-0 m-0 cursor-pointer opacity-0"
      />
      {checked && (
        <svg
          className={`pointer-events-none ${icon} text-zinc-900`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.704 5.296a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.29-7.29a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </span>
  );
}
