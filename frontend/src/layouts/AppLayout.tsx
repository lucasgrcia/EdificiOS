import { useState, type ReactNode } from 'react';

import { useAuth } from '../hooks/useAuth';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar
        isAuthenticated={isAuthenticated}
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
        }}
        onLogout={() => {
          logout();
        }}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header
          isAuthenticated={isAuthenticated}
          onMenuClick={() => {
            setSidebarOpen(true);
          }}
          user={user}
        />

        <main className="flex-1 p-4 sm:p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
