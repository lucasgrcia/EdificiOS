import { matchPath } from 'react-router-dom';

import { ROUTE_BREADCRUMBS } from './breadcrumbs';
import { ROUTES } from './paths';

export type BreadcrumbDefinition = {
  path: string;
  breadcrumb: string;
  parent?: {
    label: string;
    pathname: string;
  };
};

export const BREADCRUMB_ROUTES: BreadcrumbDefinition[] = [
  {
    path: ROUTES.incidentDetails,
    breadcrumb: ROUTE_BREADCRUMBS.incident,
    parent: {
      label: ROUTE_BREADCRUMBS.dashboard,
      pathname: ROUTES.dashboard,
    },
  },
  {
    path: ROUTES.incidents,
    breadcrumb: ROUTE_BREADCRUMBS.incidents,
  },
  {
    path: ROUTES.dashboard,
    breadcrumb: ROUTE_BREADCRUMBS.dashboard,
  },
  {
    path: ROUTES.home,
    breadcrumb: ROUTE_BREADCRUMBS.home,
  },
];

export type BreadcrumbCrumb = {
  label: string;
  pathname: string;
};

export function resolveBreadcrumbs(pathname: string): BreadcrumbCrumb[] {
  for (const route of BREADCRUMB_ROUTES) {
    if (matchPath({ path: route.path, end: true }, pathname) === null) {
      continue;
    }

    const crumbs: BreadcrumbCrumb[] = [];

    if (route.parent !== undefined) {
      crumbs.push(route.parent);
    }

    crumbs.push({
      label: route.breadcrumb,
      pathname,
    });

    return crumbs;
  }

  return [];
}
