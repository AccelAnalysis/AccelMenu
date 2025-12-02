import { AuthUser, roleAtLeast, UserRole } from '../state/authSlice';

export interface PresenceUser extends AuthUser {
  lastActive: string;
}

export type PresenceCallback = (users: PresenceUser[]) => void;

const presenceStore = new Map<string, PresenceUser[]>();

const mockUsers: PresenceUser[] = [
  { id: 'u-1', name: 'Avery', role: 'owner', avatarColor: '#1d4ed8', lastActive: new Date().toISOString() },
  { id: 'u-2', name: 'Brook', role: 'admin', avatarColor: '#047857', lastActive: new Date().toISOString() },
  { id: 'u-3', name: 'Casey', role: 'editor', avatarColor: '#be123c', lastActive: new Date().toISOString() },
  { id: 'u-4', name: 'Devon', role: 'viewer', avatarColor: '#b45309', lastActive: new Date().toISOString() },
  { id: 'u-5', name: 'Emery', role: 'editor', avatarColor: '#7c3aed', lastActive: new Date().toISOString() },
];

function seedPresence(boardSlug: string) {
  if (!presenceStore.has(boardSlug)) {
    const seeded = mockUsers.slice(0, 3).map((user, index) => ({
      ...user,
      id: `${user.id}-${boardSlug}-${index}`,
      lastActive: new Date(Date.now() - index * 90_000).toISOString(),
    }));
    presenceStore.set(boardSlug, seeded);
  }
}

function randomizePresence(boardSlug: string) {
  const existing = presenceStore.get(boardSlug) ?? [];
  const pool = [...mockUsers];
  const shouldAdd = Math.random() > 0.5;

  if (shouldAdd && existing.length < pool.length) {
    const nextUser = pool.find((candidate) => !existing.some((item) => item.name === candidate.name));
    if (nextUser) {
      presenceStore.set(boardSlug, [
        ...existing,
        {
          ...nextUser,
          id: `${nextUser.id}-${boardSlug}-${Date.now()}`,
          lastActive: new Date().toISOString(),
        },
      ]);
      return;
    }
  }

  if (!shouldAdd && existing.length > 1) {
    const trimmed = existing.slice(0, existing.length - 1);
    presenceStore.set(boardSlug, trimmed);
    return;
  }

  presenceStore.set(
    boardSlug,
    existing.map((user) => ({ ...user, lastActive: new Date().toISOString() }))
  );
}

export function getPresence(boardSlug: string): PresenceUser[] {
  seedPresence(boardSlug);
  return presenceStore.get(boardSlug) ?? [];
}

export function pollPresence(boardSlug: string): Promise<PresenceUser[]> {
  randomizePresence(boardSlug);
  return Promise.resolve(getPresence(boardSlug));
}

export function subscribeToPresence(boardSlug: string, callback: PresenceCallback, intervalMs = 4000): () => void {
  seedPresence(boardSlug);
  callback(getPresence(boardSlug));

  const interval = setInterval(async () => {
    const updated = await pollPresence(boardSlug);
    callback(updated);
  }, intervalMs);

  return () => clearInterval(interval);
}

export function filterPresenceByRole(users: PresenceUser[], minimumRole: UserRole = 'viewer'): PresenceUser[] {
  return users.filter((user) => roleAtLeast(user.role, minimumRole));
}
