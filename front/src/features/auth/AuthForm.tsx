import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import s from './PlayerGate.module.scss';

export function AuthForm({ onAuthenticated, notice }: { onAuthenticated: () => void; notice?: string }) {
  const { client } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function connect() {
    if (!client || busy) return;
    setBusy(true); setError('');
    try {
      const result = await client.auth.signInAnonymously();
      if (!mounted.current) return;
      if (result.error || !result.data.session) {
        setError(result.error?.status === 429
          ? 'Trop de tentatives. Patiente un moment avant de réessayer.'
          : 'Connexion impossible. Réessaie dans un instant.');
      } else onAuthenticated();
    } catch {
      if (mounted.current) setError('Le service de connexion est injoignable. Réessaie dans un instant.');
    } finally { if (mounted.current) setBusy(false); }
  }

  return <div className={s.panel}>
    <h2>TON ESPACE JOUEUR</h2>
    <p>Un pseudo suffit pour jouer. Aucun email ni mot de passe n’est demandé.</p>
    {notice && <p role="alert">{notice}</p>}
    <button type="button" disabled={busy} onClick={connect}>{busy ? 'Connexion…' : 'Continuer'}</button>
    {error && <p role="alert">{error}</p>}
  </div>;
}
