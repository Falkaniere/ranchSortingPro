import React from 'react';

interface QuickSelectProps {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  min: number;
  max: number;
  cols?: number;
}

export function QuickSelect({ label, value, onChange, min, max, cols = 6 }: QuickSelectProps) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div>
      <p className="text-sm font-medium text-rope-700 mb-2">{label}</p>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={[
              'py-2 rounded-lg text-sm font-semibold border transition-all min-h-[40px]',
              value === n
                ? 'bg-saddle-600 text-white border-saddle-700 shadow-sm'
                : 'bg-white text-rope-700 border-dust-300 hover:border-saddle-400 hover:bg-dust-50',
            ].join(' ')}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
