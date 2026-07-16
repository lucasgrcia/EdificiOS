import type { AuthenticatedUser } from '../../types/auth';

type HeaderProps = {
  onMenuClick: () => void;
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
};

export function Header({ onMenuClick, user, isAuthenticated }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:h-16 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Abrir menú de navegación"
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>
        <span className="truncate text-sm font-medium text-slate-600">
          Panel operativo
        </span>
      </div>

      {isAuthenticated && user !== null && (
        <div className="flex min-w-0 items-center gap-3 text-right">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.displayName}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <div
            aria-label="Sesión activa"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
            role="status"
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full bg-emerald-500"
            />
            Activa
          </div>
        </div>
      )}
    </header>
  );
}
