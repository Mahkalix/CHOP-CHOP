import { useEffect } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider } from '../src/features/auth/AuthProvider';
import { PlayerGate } from '../src/features/auth/PlayerGate';

const authMock = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: unknown) => void),
  getSession: vi.fn(), signInAnonymously: vi.fn(), signOut: vi.fn(), unsubscribe: vi.fn(),
  configured: true,
}));
vi.mock('../src/features/auth/client', () => ({ getAuthClient: () => authMock.configured ? { auth: {
  ...authMock,
  onAuthStateChange: (callback: typeof authMock.listener) => {
    authMock.listener = callback;
    return { data: { subscription: { unsubscribe: authMock.unsubscribe } } };
  },
} } : null }));

const session = { access_token: 'current-token', user: { id: 'player-id' } } as Session;
const profile = { id: 'player-id', pseudo: 'Miso' };
const response = (value: unknown, status = 200) => ({ ok: status < 400, status, json: async () => value });
const mount = () => render(<AuthProvider><PlayerGate /></AuthProvider>);

beforeEach(() => {
  vi.resetAllMocks();
  authMock.configured = true;
  authMock.listener = null;
  authMock.getSession.mockResolvedValue({ data: { session: null }, error: null });
  vi.stubEnv('VITE_API_URL', 'https://api.example.com');
  sessionStorage.clear();
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it('shows a useful unavailable state without configuration', () => {
  authMock.configured = false;
  mount();
  expect(screen.getByText(/service joueur n’est pas encore disponible/)).toBeTruthy();
  expect(authMock.getSession).not.toHaveBeenCalled();
});

it('opens an anonymous session, reads the profile and unlocks the existing kitchen', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn().mockResolvedValue(response(profile));
  vi.stubGlobal('fetch', fetchMock);
  authMock.signInAnonymously.mockImplementation(async () => {
    authMock.listener?.('SIGNED_IN', session);
    return { data: { session }, error: null };
  });
  render(<AuthProvider><PlayerGate><p>Kitchen mounted</p></PlayerGate></AuthProvider>);
  expect(screen.queryByText('Kitchen mounted')).toBeNull();
  await user.click(await screen.findByRole('button', { name: 'Continuer' }));
  expect(await screen.findByText('Kitchen mounted')).toBeTruthy();
  expect(authMock.signInAnonymously).toHaveBeenCalledWith();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0]![1]).toMatchObject({ method: 'GET', headers: { Authorization: 'Bearer current-token' } });
  expect(screen.queryByLabelText('Email')).toBeNull();
  expect(screen.queryByLabelText('Mot de passe')).toBeNull();
});

it('does not open the kitchen or call the API when anonymous sign-in fails', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  authMock.signInAnonymously.mockResolvedValue({ data: { session: null }, error: { status: 400 } });
  render(<AuthProvider><PlayerGate><p>Kitchen mounted</p></PlayerGate></AuthProvider>);
  await user.click(await screen.findByRole('button', { name: 'Continuer' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Connexion impossible. Réessaie dans un instant.');
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.queryByText('Kitchen mounted')).toBeNull();
});

it('restores a session, handles a taken pseudo, then saves a trimmed profile', async () => {
  const user = userEvent.setup();
  authMock.getSession.mockResolvedValue({ data: { session }, error: null });
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(response(null, 404))
    .mockResolvedValueOnce(response(null, 409))
    .mockResolvedValueOnce(response(profile));
  vi.stubGlobal('fetch', fetchMock);
  sessionStorage.setItem('pseudo', '  Miso  ');
  mount();
  await user.click(await screen.findByRole('button', { name: 'Enregistrer le pseudo' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Ce pseudo est déjà pris. Choisis-en un autre.');
  await user.click(screen.getByRole('button', { name: 'Enregistrer le pseudo' }));
  expect(await screen.findByText('Ton profil est prêt.')).toBeTruthy();
  expect(fetchMock.mock.calls[2]![1]).toMatchObject({ method: 'PUT', headers: { Authorization: 'Bearer current-token' }, body: JSON.stringify({ pseudo: 'Miso' }) });
});

it('requires login when the API refuses an expired session', async () => {
  authMock.getSession.mockResolvedValue({ data: { session }, error: null });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(null, 401)));
  mount();
  expect(await screen.findByText('Ta session a expiré. Reconnecte-toi pour continuer.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Continuer' })).toBeTruthy();
  expect(screen.queryByText('Ton profil est prêt.')).toBeNull();
});

it('retries a profile request after a network failure', async () => {
  const user = userEvent.setup();
  authMock.getSession.mockResolvedValue({ data: { session }, error: null });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError()).mockResolvedValueOnce(response(profile)));
  mount();
  await user.click(await screen.findByRole('button', { name: 'Réessayer' }));
  expect(await screen.findByText('Ton profil est prêt.')).toBeTruthy();
});

it('keeps an existing pseudo immutable and supports leaving the anonymous session', async () => {
  const user = userEvent.setup();
  authMock.getSession.mockResolvedValue({ data: { session }, error: null });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(profile)));
  authMock.signOut.mockImplementation(async () => {
    authMock.listener?.('SIGNED_OUT', null);
    return { error: null };
  });
  mount();
  expect(await screen.findByRole('heading', { name: 'BONJOUR Miso' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Modifier mon pseudo' })).toBeNull();
  expect(screen.queryByLabelText('Pseudo du classement')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Se déconnecter' }));
  expect(await screen.findByRole('button', { name: 'Continuer' })).toBeTruthy();
  expect(authMock.signOut).toHaveBeenCalledWith({ scope: 'local' });
});

it('ignores late profile responses and aborts the old token request after token refresh', async () => {
  authMock.getSession.mockResolvedValue({ data: { session }, error: null });
  let oldSignal: AbortSignal | undefined;
  let resolveOld: ((value: unknown) => void) | undefined;
  const fetchMock = vi.fn()
    .mockImplementationOnce((_url, options) => { oldSignal = options.signal; return new Promise(resolve => { resolveOld = resolve; }); })
    .mockResolvedValueOnce(response({ ...profile, pseudo: 'New profile' }));
  vi.stubGlobal('fetch', fetchMock);
  mount();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  act(() => authMock.listener?.('TOKEN_REFRESHED', { ...session, access_token: 'new-token' }));
  expect(await screen.findByRole('heading', { name: 'BONJOUR New profile' })).toBeTruthy();
  expect(oldSignal?.aborted).toBe(true);
  await act(async () => resolveOld?.(response(profile)));
  expect(screen.queryByText('BONJOUR Miso')).toBeNull();
  expect(fetchMock.mock.calls[1]![1].headers.Authorization).toBe('Bearer new-token');
});

it('supports anonymous sign-in by keyboard and reports rate limits', async () => {
  const user = userEvent.setup();
  authMock.signInAnonymously.mockResolvedValue({ data: { session: null }, error: { status: 429 } });
  mount();
  const button = await screen.findByRole('button', { name: 'Continuer' });
  await user.tab(); expect(document.activeElement).toBe(button);
  await user.keyboard('{Enter}');
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('Trop de tentatives.'));
});

it('unsubscribes when leaving the route', async () => {
  const { unmount } = mount();
  await screen.findByRole('button', { name: 'Continuer' });
  unmount();
  expect(authMock.unsubscribe).toHaveBeenCalledOnce();
});

it('keeps the kitchen mounted while the access token refreshes', async () => {
  authMock.getSession.mockResolvedValue({ data: { session }, error: null });
  const stopped = vi.fn();
  function KitchenProbe() {
    useEffect(() => stopped, []);
    return <p>Kitchen running</p>;
  }
  let resolveRefresh: ((value: unknown) => void) | undefined;
  const fetchMock = vi.fn().mockResolvedValueOnce(response(profile))
    .mockImplementationOnce(() => new Promise(resolve => { resolveRefresh = resolve; }));
  vi.stubGlobal('fetch', fetchMock);
  render(<AuthProvider><PlayerGate><KitchenProbe /></PlayerGate></AuthProvider>);
  await screen.findByText('Kitchen running');
  act(() => authMock.listener?.('TOKEN_REFRESHED', { ...session, access_token: 'new-token' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(stopped).not.toHaveBeenCalled();
  expect(screen.getByText('Kitchen running')).toBeTruthy();
  await act(async () => resolveRefresh?.(response(profile)));
  expect(stopped).not.toHaveBeenCalled();
});
