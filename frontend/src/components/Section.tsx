import type { ReactNode } from 'react';

type SectionProps = {
  children: ReactNode;
  className?: string;
};

export function Section({ children, className = '' }: SectionProps) {
  return <section className={`space-y-4 ${className}`}>{children}</section>;
}
