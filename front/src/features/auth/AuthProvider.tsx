import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { getAuthClient } from './client';

type AuthState = {
  client: SupabaseClient | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
};
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authRedirect] = useState(() => /(?:access_token|error_description)=/.test(window.location.hash));
  const [client] = useState(getAuthClient);
  const [state, setState] = useState<Omit<AuthState, 'client'>>({ session: null, loading: !!client, error: null });
  useEffect(() => {
    if (!client) return;
    let active = true;
    let eventReceived = false;
    let isAuthRedirect = authRedirect;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      // Keep this callback synchronous: SDK auth operations may hold a lock here.
      eventReceived = true;
      if (active) setState({
        session, loading: false,
        error: isAuthRedirect && !session ? 'Ce lien n’a pas rétabli ta connexion. Connecte-toi ci-dessous.' : null,
      });
      if (active && isAuthRedirect) { isAuthRedirect = false; window.location.hash = 'jouer'; }
    });
    client.auth.getSession().then(({ data, error }) => {
      if (active && !eventReceived) setState({
        session: data.session, loading: false,
        error: error ? 'Impossible de restaurer ta connexion. Réessaie de te connecter.' : null,
      });
    }).catch(() => {
      if (active && !eventReceived) setState({ session: null, loading: false, error: 'Connexion indisponible pour le moment.' });
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [client, authRedirect]);
  return <AuthContext.Provider value={{ client, ...state }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}
