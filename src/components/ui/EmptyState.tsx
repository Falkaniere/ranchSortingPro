import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      {icon && (
        <div className="mb-4 text-5xl opacity-40">{icon}</div>
      )}
      <h3 className="font-serif font-semibold text-rope-700 text-lg mb-1">{title}</h3>
      {description && (
        <p className="text-rope-400 text-sm max-w-xs mb-5">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
