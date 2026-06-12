import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export function Card({ children, className = '', title, subtitle, footer, noPadding }: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-xl border border-dust-300 shadow-sm',
        className,
      ].join(' ')}
    >
      {(title || subtitle) && (
        <div className="px-5 pt-5 pb-3 border-b border-dust-200">
          {title && (
            <h3 className="font-serif font-semibold text-rope-800 text-lg leading-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-rope-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-dust-200 bg-dust-50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
