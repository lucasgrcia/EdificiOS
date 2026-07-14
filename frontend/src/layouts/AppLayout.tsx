import { useState, type ReactNode } from 'react';

import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
        }}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header
          onLogout={logout}
          onMenuClick={() => {
            setSidebarOpen(true);
          }}
          showLogout={isAuthenticated}
        />

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
