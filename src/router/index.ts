export interface RouteMatch {
  name: 'locationBoard' | 'unknown';
  params?: {
    locationSlug: string;
    boardSlug: string;
  };
}

const boardRoutePattern = /^\/locations\/([^/]+)\/boards\/([^/]+)\/?$/;

export const routes = [
  {
    name: 'locationBoard' as const,
    path: '/locations/:locationSlug/boards/:boardSlug',
    pattern: boardRoutePattern,
  },
];

export function resolveRoute(pathname: string): RouteMatch {
  const normalized = pathname.startsWith('http')
    ? new URL(pathname).pathname
    : pathname;

  const boardMatch = normalized.match(boardRoutePattern);
  if (boardMatch) {
    const [, locationSlug, boardSlug] = boardMatch;
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
