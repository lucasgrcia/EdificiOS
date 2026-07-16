import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  role?: string;
};

export function Card({ children, className = '', id, role }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}
      id={id}
      role={role}
    >
      {children}
    </div>
  );
}
