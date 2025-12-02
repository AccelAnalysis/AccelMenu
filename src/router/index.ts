import { roleAtLeast, UserRole } from '../state/authSlice';

export interface RouteMatch {
  name: 'locationBoard' | 'unknown' | 'unauthorized';
  params?: {
    locationSlug: string;
    boardSlug: string;
  };
  requiredRole?: UserRole;
}

interface RouteDefinition {
  name: 'locationBoard';
  path: string;
  pattern: RegExp;
  allowedRoles?: UserRole[];
}

const boardRoutePattern = /^\/locations\/([^/]+)\/boards\/([^/]+)\/?$/;
const editorRoles: UserRole[] = ['owner', 'admin', 'editor'];

export const routes: RouteDefinition[] = [
  {
    name: 'locationBoard' as const,
    path: '/locations/:locationSlug/boards/:boardSlug',
    pattern: boardRoutePattern,
    allowedRoles: editorRoles,
  },
];

function isRouteAllowed(role: UserRole, allowedRoles?: UserRole[]) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((allowedRole) => roleAtLeast(role, allowedRole));
}

export function resolveRoute(pathname: string, role: UserRole = 'viewer'): RouteMatch {
  const normalized = pathname.startsWith('http')
    ? new URL(pathname).pathname
    : pathname;

  const boardMatch = normalized.match(boardRoutePattern);
  if (boardMatch) {
    const [, locationSlug, boardSlug] = boardMatch;
    const route = routes.find((entry) => entry.name === 'locationBoard');
    if (route && !isRouteAllowed(role, route.allowedRoles)) {
      return {
        name: 'unauthorized',
        params: { locationSlug, boardSlug },
        requiredRole: route.allowedRoles?.[0],
      };
    }

    return {
      name: 'locationBoard',
      params: { locationSlug, boardSlug },
    };
  }

  return { name: 'unknown' };
}

export function buildBoardPath(locationSlug: string, boardSlug: string): string {
  return `/locations/${locationSlug}/boards/${boardSlug}`;
}
