import { Link, useLocation } from 'react-router-dom';

import { resolveBreadcrumbs } from '../../routes/breadcrumb-routes';

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = resolveBreadcrumbs(pathname);

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={`${crumb.pathname}-${crumb.label}`} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden className="text-slate-400">
                  &gt;
                </span>
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-medium text-slate-900"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  className="font-medium text-slate-700 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                  to={crumb.pathname}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
