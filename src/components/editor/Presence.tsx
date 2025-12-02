import { useEffect, useMemo, useState } from 'react';
import { PresenceUser, subscribeToPresence } from '../../api/presence';
import { useAuth } from '../../state/authSlice';

interface PresenceProps {
  boardSlug: string;
  locationSlug?: string;
  pollingIntervalMs?: number;
}

function Avatar({ user }: { user: PresenceUser }) {
  const initials = useMemo(() => {
    const [first, second] = user.name.split(' ');
    return (first?.[0] ?? '').concat(second?.[0] ?? '').toUpperCase() || user.name[0];
  }, [user.name]);

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: user.avatarColor || '#1f2937' }}
      title={`${user.name} (${user.role})`}
    >
      {initials}
    </div>
  );
}

export function Presence({ boardSlug, locationSlug, pollingIntervalMs = 5000 }: PresenceProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [status, setStatus] = useState<'idle' | 'connected'>('idle');

  useEffect(() => {
    if (!boardSlug) return undefined;

    setStatus('idle');
    const unsubscribe = subscribeToPresence(boardSlug, (nextUsers) => {
      setUsers(nextUsers);
      setStatus('connected');
    }, pollingIntervalMs);

    return () => unsubscribe();
  }, [boardSlug, pollingIntervalMs]);

  const collaborators = useMemo(() => {
    const uniqueByName = new Map<string, PresenceUser>();
    users.forEach((entry) => {
      if (!uniqueByName.has(entry.name)) {
        uniqueByName.set(entry.name, entry);
      }
    });
    return Array.from(uniqueByName.values());
  }, [users]);

  const headline = useMemo(() => {
    if (status === 'idle') return 'Connecting…';
    if (collaborators.length === 0) return 'No collaborators online';
    return `${collaborators.length} active ${collaborators.length === 1 ? 'editor' : 'editors'}`;
  }, [collaborators.length, status]);

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {collaborators.length === 0 ? (
            <span className="rounded-full bg-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600">Offline</span>
          ) : (
            collaborators.map((member) => <Avatar key={member.id} user={member} />)
          )}
        </div>
        {currentUser ? (
          <div className="flex flex-col text-[11px] leading-tight text-gray-600">
            <span className="font-semibold text-gray-900">{headline}</span>
            <span>
              You are signed in as <strong>{currentUser.name}</strong>
              {locationSlug ? ` • ${locationSlug}` : ''}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-gray-600">{headline}</span>
        )}
      </div>
    </div>
  );
}

export default Presence;
