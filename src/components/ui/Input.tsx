import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, className = '', id, ...props }, ref) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-rope-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full px-3 py-2 rounded-lg border text-rope-800 bg-white',
            'placeholder:text-rope-300 text-sm',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-hay-400 focus:border-hay-400',
            error
              ? 'border-brand-500 focus:ring-brand-500'
              : 'border-dust-300 hover:border-saddle-400',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-brand-500 mt-0.5">{error}</p>}
        {hint && !error && <p className="text-xs text-rope-400 mt-0.5">{hint}</p>}
      </div>
    );
  }
);

interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number;
  max?: number;
}

export function NumberInput({ min, max, ...props }: NumberInputProps) {
  return <Input type="number" min={min} max={max} {...props} />;
}
