import type { ReactNode } from 'react';

import { EmptyStateIcon, type EmptyStateIconName } from './EmptyStateIcon';

type EmptyStateProps = {
  icon: EmptyStateIconName;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center sm:px-6"
      role="status"
    >
      <EmptyStateIcon name={icon} />
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        {description}
      </p>
      {action !== undefined && (
        <div className="mt-4 flex justify-center">{action}</div>
      )}
    </div>
  );
}
