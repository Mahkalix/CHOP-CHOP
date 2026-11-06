import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';
import s from './PlayerGate.module.scss';

export function AuthForm({ onAuthenticated, notice }: { onAuthenticated: () => void; notice?: string }) {
  const { client } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!client || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const credentials = { email: email.trim(), password };
      const result = mode === 'signup'
        ? await client.auth.signUp({ ...credentials, options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` } })
        : await client.auth.signInWithPassword(credentials);
      if (!mounted.current) return;
      if (result.error) {
        setError(result.error.status === 429
          ? 'Trop de tentatives. Patiente un moment avant de réessayer.'
          : mode === 'login'
            ? 'Connexion impossible. Vérifie ton email, ton mot de passe et la confirmation de ton compte.'
            : 'Inscription impossible. Vérifie tes informations ou réessaie plus tard.');
      } else if (result.data.session) {
        onAuthenticated();
      } else {
        setMessage('Consulte tes emails pour confirmer ton compte, puis connecte-toi ici. Si tu as déjà un compte, utilise Connexion.');
      }
    } catch {
      if (mounted.current) setError('Le service de connexion est injoignable. Réessaie dans un instant.');
    } finally {
      if (mounted.current) { setBusy(false); setPassword(''); }
    }
  }

  return <div className={s.panel}>
    <h2>{mode === 'login' ? 'CONNECTE-TOI' : 'CRÉE TON COMPTE'}</h2>
    <p>Connecte-toi pour associer tes futures parties à ton profil.</p>
    {notice && <p role="alert">{notice}</p>}
    <form onSubmit={submit} aria-busy={busy}>
      <label htmlFor="player-email">Email</label>
      <input id="player-email" name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
      <label htmlFor="player-password">Mot de passe</label>
      <input id="player-password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'signup' ? 6 : undefined} required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
      {mode === 'signup' && <small>Au moins 6 caractères. Le service peut demander un mot de passe plus long.</small>}
      <button type="submit" disabled={busy}>{busy ? 'Patiente…' : mode === 'login' ? 'Se connecter' : 'Créer un compte'}</button>
    </form>
    <p role="status">{message}</p>
    {error && <p role="alert">{error}</p>}
    <button type="button" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); setPassword(''); }}>
      {mode === 'login' ? 'Créer un compte' : 'J’ai déjà un compte'}
    </button>
  </div>;
}
