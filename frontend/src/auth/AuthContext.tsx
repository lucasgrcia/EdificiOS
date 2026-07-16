import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { fetchCurrentUser, login as loginRequest } from '../api/auth.api';
import { ROUTES } from '../routes/paths';
import { toast } from '../toast/toastStore';
import type { AuthenticatedUser } from '../types/auth';
import {
  clearAuthToken,
  getAuthToken,
  hasAuthToken,
  setAuthToken,
} from './authToken';
import {
  registerUnauthorizedHandler,
  resetUnauthorizedHandling,
  suppressUnauthorizedNotifications,
} from './unauthorizedHandler';

export type LogoutReason = 'manual' | 'expired' | 'silent';

export type LogoutOptions = {
  reason?: LogoutReason;
  redirect?: boolean;
};

type AuthContextValue = {
  token: string | null;
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string) => Promise<void>;
  logout: (options?: LogoutOptions) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(() => hasAuthToken());

  const clearSession = useCallback(() => {
    clearAuthToken();
    setTokenState(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const logout = useCallback(
    (options?: LogoutOptions) => {
      const reason = options?.reason ?? 'manual';
      const shouldRedirect = options?.redirect ?? reason !== 'silent';

      clearSession();

      if (reason === 'manual' || reason === 'silent') {
        resetUnauthorizedHandling();
      }

      if (reason === 'expired') {
        toast.error('La sesión expiró. Inicia sesión nuevamente.');
      } else if (reason === 'manual') {
        toast.info(
          'Sesión cerrada',
          'Tu token fue eliminado de este dispositivo.',
        );
      }

      if (shouldRedirect && location.pathname !== ROUTES.login) {
        navigate(ROUTES.login, { replace: true });
      }
    },
    [clearSession, location.pathname, navigate],
  );

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout({ reason: 'expired', redirect: true });
    });

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, [logout]);

  useEffect(() => {
    if (!hasAuthToken()) {
      setIsInitializing(false);
      return;
    }

    let cancelled = false;
    suppressUnauthorizedNotifications(true);

    void fetchCurrentUser()
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser);
          setIsInitializing(false);
          resetUnauthorizedHandling();
        }
      })
      .catch(() => {
        if (!cancelled) {
          logout({ reason: 'silent', redirect: false });
          setIsInitializing(false);
        }
      })
      .finally(() => {
        suppressUnauthorizedNotifications(false);
      });

    return () => {
      cancelled = true;
      suppressUnauthorizedNotifications(false);
    };
  }, [logout]);

  const login = useCallback(
    async (email: string) => {
      try {
        const { accessToken } = await loginRequest({
          email: email.trim().toLowerCase(),
        });

        setAuthToken(accessToken);
        setTokenState(accessToken.trim());

        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        resetUnauthorizedHandling();
      } catch (error) {
        clearSession();
        resetUnauthorizedHandling();
        throw error;
      }
    },
    [clearSession],
  );

  const isAuthenticated =
    user !== null && token !== null && token.trim() !== '';

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated,
      isInitializing,
      login,
      logout,
    }),
    [token, user, isAuthenticated, isInitializing, login, logout],
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
