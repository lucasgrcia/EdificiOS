import { Link, NavLink, useLocation } from 'react-router-dom';

import { ROUTES } from '../../routes/paths';

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-700 hover:bg-slate-100'
  }`;

type SidebarProps = {
  isOpen: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onLogout: () => void;
};

function isIncidentsPath(pathname: string): boolean {
  return (
    pathname === ROUTES.incidents ||
    pathname.startsWith(`${ROUTES.incidents}/`)
  );
}

export function Sidebar({
  isOpen,
  isAuthenticated,
  onClose,
  onLogout,
}: SidebarProps) {
  const location = useLocation();
  const incidentsActive = isIncidentsPath(location.pathname);

  return (
    <>
      {isOpen && (
        <button
          aria-label="Cerrar menú de navegación"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}

      <aside
        aria-label="Navegación principal"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] transform flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:max-w-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center border-b border-slate-200 px-4 sm:h-16 sm:px-6">
          <span className="text-sm font-semibold tracking-wide text-slate-900">
            EdificiOS
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
          <NavLink
            className={linkClassName}
            end
            onClick={onClose}
            to={ROUTES.home}
          >
            Home
          </NavLink>

          <NavLink
            className={linkClassName}
            end
            onClick={onClose}
            to={ROUTES.dashboard}
          >
            Dashboard
          </NavLink>

          <Link
            aria-current={incidentsActive ? 'page' : undefined}
            className={`block rounded-md px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
              incidentsActive
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            onClick={onClose}
            to={ROUTES.incidents}
          >
            Incidencias
          </Link>

          <a
            className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            href={ROUTES.apiDocs}
            onClick={onClose}
            rel="noopener noreferrer"
            target="_blank"
          >
            API Docs
          </a>
        </nav>

        {isAuthenticated && (
          <div className="border-t border-slate-200 p-3 sm:p-4">
            <button
              className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              onClick={() => {
                onClose();
                onLogout();
              }}
              type="button"
            >
              Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
