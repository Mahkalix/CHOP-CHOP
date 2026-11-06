import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import s from './PlayerGate.module.scss';

export function AuthForm({ onAuthenticated, notice, recoverSession = false }: { onAuthenticated: () => void; notice?: string; recoverSession?: boolean }) {
  const { client, session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function connect() {
    if (!client || busy) return;
    setBusy(true); setError('');
    try {
      // Never replace an existing anonymous identity after a temporary API failure.
      const stored = session ? { data: { session }, error: null } : await client.auth.getSession();
      if (stored.error) throw stored.error;
      const result = stored.data.session || recoverSession
        ? await client.auth.refreshSession()
        : await client.auth.signInAnonymously();
      if (!result.error && result.data.session) onAuthenticated();
      else if (mounted.current) {
        setError(result.error?.status === 429
          ? 'Trop de tentatives. Patiente un moment avant de réessayer.'
          : 'Connexion impossible. Réessaie dans un instant.');
      }
    } catch {
      if (mounted.current) setError('Le service de connexion est injoignable. Réessaie dans un instant.');
    } finally { if (mounted.current) setBusy(false); }
  }

  return <div className={s.panel}>
    <h2>TON ESPACE JOUEUR</h2>
    <p>Un pseudo suffit pour jouer. Aucun email ni mot de passe n’est demandé.</p>
    {(error || notice) && <p role="alert">{error || notice}</p>}
    <button type="button" disabled={busy} onClick={connect}>{busy ? 'Connexion…' : 'Continuer'}</button>
  </div>;
}
