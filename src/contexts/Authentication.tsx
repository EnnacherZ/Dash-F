/**
 * dashboard/contexts/Authentication.tsx
 *
 * Manages authentication state for the admin dashboard.
 * - Verifies session via GET /db/check-auth/ on mount (DashboardCookieJWTAuthentication
 *   on the backend rejects client tokens before this even resolves)
 * - Stores non-sensitive user info in memory (not localStorage)
 * - Handles token refresh transparently
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import Loading from "../components/loading";
import apiInstance from "@/lib/api";
import Login from "../pages/LogIn";
import DeliveryPortal from "../pages/DeliveryPortal";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DashboardUser {
  username:   string;
  email:      string;
  first_name: string;
  last_name:  string;
  role:       "admin" | "manager" | "delivery";
  image:      string;
}

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: DashboardUser }
  | { status: "unauthenticated" };

interface AuthContextValue {
  user:         DashboardUser | null;
  isAuthorized: boolean;
  isLoading:    boolean;
  signIn:  (e: React.FormEvent, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user:         null,
  isAuthorized: false,
  isLoading:    false,
  signIn:       async () => {},
  signOut:      async () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t } = useTranslation();
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const didCheck = useRef(false);

  /**
   * Verify the cookie session against the backend.
   * DashboardCookieJWTAuthentication on the backend rejects client tokens,
   * so we never need role logic here.
   */
  const checkAuth = useCallback(async (isRetry = false): Promise<void> => {
    try {
      const res = await apiInstance.get<{ user: DashboardUser }>("db/check-auth/");
      setAuth({ status: "authenticated", user: res.data.user });

    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 401 && !isRetry) {
        // Try to refresh the access cookie once
        try {
          await apiInstance.post("db/refreshcookie");
          return checkAuth(true);
        } catch {
          // Refresh failed
        }
      }

      setAuth({ status: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    if (didCheck.current) return;
    didCheck.current = true;
    checkAuth();
  }, [checkAuth]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const signIn = useCallback(
    async (
      e: React.FormEvent,
      username: string,
      password: string
    ): Promise<void> => {
      e.preventDefault();
      try {
        const res = await apiInstance.post<{ user: DashboardUser }>(
          "db/token",
          { username, password }
        );
        setAuth({ status: "authenticated", user: res.data.user });
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ??
          err?.response?.data?.detail ??
          t('auth.genericError');
        setAuth({ status: "unauthenticated" });
        // Re-throw so the Login component can display the error
        throw new Error(msg);
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await apiInstance.post("db/logout");
    } finally {
      // No navigation call needed here: this provider wraps <RouterProvider>
      // (so useNavigate isn't reachable from inside it anyway), and its own
      // render below already swaps to <Login/> the instant auth flips to
      // unauthenticated, regardless of the current URL. The old goTo('/Login')
      // hard-reloaded the entire app just to show a screen that would have
      // appeared on its own.
      setAuth({ status: "unauthenticated" });
    }
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────

  const isLoading    = auth.status === "loading";
  const isAuthorized = auth.status === "authenticated";
  const user         = auth.status === "authenticated" ? auth.user : null;

  return (
    <AuthContext.Provider value={{ user, isAuthorized, isLoading, signIn, signOut }}>
      {isLoading ? (
        <Loading message={t('ui.loading')} />
      ) : isAuthorized ? (
        user?.role === 'delivery' ? (
          <DeliveryPortal user={user} signOut={signOut} />
        ) : (
          children
        )
      ) : (
        <Login />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { AuthContext };