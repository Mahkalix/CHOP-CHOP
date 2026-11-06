import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { PseudoSchema, type Profile } from '@chopchop/shared';
import { useAuth } from './AuthProvider';
import { AuthForm } from './AuthForm';
import { ProfileError, requestProfile } from './profileApi';
import s from './PlayerGate.module.scss';

export function PlayerGate({ children }: { children?: ReactNode }) {
  const { client, session, loading, error } = useAuth();
  const [rejectedToken, setRejectedToken] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  if (!client) return <section className={s.panel}><h2>La connexion se prépare.</h2><p>Le service joueur n’est pas encore disponible. Reviens bientôt.</p></section>;
  if (loading) return <p role="status">Restauration de ta connexion…</p>;
  const token = session?.access_token;
  if (!token || token === rejectedToken) return <AuthForm
    recoverSession={rejectedToken !== null}
    notice={token === rejectedToken ? 'Ta session a expiré. Reconnecte-toi pour continuer.' : error ?? undefined}
    onAuthenticated={() => setRejectedToken(null)}
  />;

  async function signOut() {
    if (!client || signingOut || !window.confirm('Se déconnecter fait perdre ton profil sur ce navigateur. Continuer ?')) return;
    setSigningOut(true); setLogoutError('');
    try {
      const { error: failure } = await client.auth.signOut({ scope: 'local' });
      if (failure) setLogoutError('Déconnexion impossible. Réessaie.');
    } catch { setLogoutError('Déconnexion impossible. Réessaie.'); }
    finally { setSigningOut(false); }
  }
  return <section>
    <ProfilePanel key={session.user.id} token={token} onExpired={() => setRejectedToken(token)}>{children}</ProfilePanel>
    <p>Quitter cette session anonyme fait perdre l’accès à ton profil sur ce navigateur.</p>
    <button type="button" onClick={signOut} disabled={signingOut}>{signingOut ? 'Déconnexion…' : 'Se déconnecter'}</button>
    {logoutError && <p role="alert">{logoutError}</p>}
  </section>;
}

function ProfilePanel({ token, onExpired, children }: { token: string; onExpired: () => void; children?: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const hasProfile = useRef(false);
  const [pseudo, setPseudo] = useState(() => {
    try { return sessionStorage.getItem('pseudo') ?? ''; } catch { return ''; }
  });
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const saveController = useRef<AbortController | null>(null);
  const loadController = useRef<AbortController | null>(null);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    if (saveController.current) return;
    const controller = new AbortController();
    loadController.current = controller;
    setLoading(!hasProfile.current); setError(''); setLoadFailed(false);
    requestProfile(token, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      if (!data && hasProfile.current) {
        setError('Ton profil est temporairement indisponible. Réessaie plus tard.');
        setLoadFailed(true); setLoading(false); return;
      }
      hasProfile.current = !!data;
      setProfile(data);
      if (data) setPseudo(data.pseudo);
      setLoading(false);
    }).catch((failure: unknown) => {
      if (controller.signal.aborted) return;
      if (failure instanceof ProfileError && failure.status === 401) onExpiredRef.current();
      else { setError(failure instanceof Error ? failure.message : 'Profil indisponible.'); setLoadFailed(true); }
      setLoading(false);
    });
    return () => controller.abort();
  }, [token, attempt]);

  useEffect(() => () => saveController.current?.abort(), []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saveController.current) return;
    const parsed = PseudoSchema.safeParse(pseudo);
    if (!parsed.success) { setError('Choisis 2 à 16 caractères : lettres, chiffres, espaces, _ ou -.'); return; }
    const controller = new AbortController();
    loadController.current?.abort();
    saveController.current = controller;
    setSaving(true); setError('');
    try {
      const data = await requestProfile(token, controller.signal, parsed.data);
      if (controller.signal.aborted || !data) return;
      hasProfile.current = !!data;
      setProfile(data); setPseudo(data.pseudo);
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ProfileError && failure.status === 401) onExpiredRef.current();
      else setError(failure instanceof Error ? failure.message : 'Enregistrement impossible.');
    } finally {
      if (!controller.signal.aborted) { saveController.current = null; setSaving(false); }
    }
  }

  if (loading) return <p role="status">Chargement de ton profil…</p>;
  if (loadFailed && !profile) return <><p role="alert">{error}</p><button onClick={() => setAttempt(value => value + 1)}>Réessayer</button></>;
  return <>
    <h2>{profile ? `BONJOUR ${profile.pseudo}` : 'CHOISIS TON PSEUDO'}</h2>
    {!profile ? <form onSubmit={save} aria-busy={saving}>
      <label htmlFor="player-pseudo">Pseudo du classement</label>
      <input id="player-pseudo" autoComplete="nickname" minLength={2} maxLength={16} required value={pseudo} onChange={event => setPseudo(event.target.value)} disabled={saving} aria-describedby="pseudo-hint" />
      <small id="pseudo-hint">2 à 16 caractères : lettres, chiffres, espaces, _ ou -.</small>
      <button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer le pseudo'}</button>
    </form> : <>
      <p role="status">Ton profil est prêt.</p>
      {children}
    </>}
    {error && <p role="alert">{error}</p>}
    {loadFailed && profile && <button onClick={() => setAttempt(value => value + 1)}>Réessayer</button>}
  </>;
}
