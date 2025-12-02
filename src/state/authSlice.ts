import React, { createContext, useContext, useMemo, useState } from 'react';

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  avatarColor?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  setUser: (nextUser: AuthUser | null) => void;
  signOut: () => void;
  hasRole: (role: UserRole) => boolean;
  canEdit: boolean;
  canDeleteSlides: boolean;
  canDeleteBoards: boolean;
}

const rolePriority: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export function roleAtLeast(role: UserRole, required: UserRole): boolean {
  return rolePriority[role] >= rolePriority[required];
}

const defaultUser: AuthUser = {
  id: 'viewer-guest',
  name: 'Guest',
  role: 'viewer',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
}

export function AuthProvider({ children, initialUser = defaultUser }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  const value = useMemo<AuthContextValue>(() => {
    const role = user?.role ?? 'viewer';
    const hasRole = (requiredRole: UserRole) => roleAtLeast(role, requiredRole);

    return {
      user,
      role,
      isAuthenticated: Boolean(user),
      setUser,
      signOut: () => setUser(null),
      hasRole,
      canEdit: hasRole('editor'),
      canDeleteSlides: hasRole('editor'),
      canDeleteBoards: hasRole('admin'),
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: defaultUser,
      role: defaultUser.role,
      isAuthenticated: false,
      setUser: () => undefined,
      signOut: () => undefined,
      hasRole: (requiredRole: UserRole) => roleAtLeast(defaultUser.role, requiredRole),
      canEdit: false,
      canDeleteSlides: false,
      canDeleteBoards: false,
    };
  }
  return context;
}
