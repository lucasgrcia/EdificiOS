import type { ReactNode } from 'react';

import { Container } from '../components/Container';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Container className="max-w-md">{children}</Container>
    </div>
  );
}
