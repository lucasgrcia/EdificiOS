import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { fetchCurrentUser, login as loginRequest } from '../api/auth.api';
import type { AuthenticatedUser } from '../types/auth';
import {
  clearAuthToken,
  getAuthToken,
  hasAuthToken,
  setAuthToken,
} from './authToken';

type AuthContextValue = {
  token: string | null;
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    if (!hasAuthToken()) {
      return;
    }

    let cancelled = false;

    void fetchCurrentUser()
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthToken();
          setTokenState(null);
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string) => {
    try {
      const { accessToken } = await loginRequest({
        email: email.trim().toLowerCase(),
      });

      setAuthToken(accessToken);
      setTokenState(accessToken.trim());

      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (error) {
      clearAuthToken();
      setTokenState(null);
      setUser(null);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: token !== null && token !== '',
      login,
      logout,
    }),
    [token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
