import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider } from '../src/features/auth/AuthProvider';
import { PlayerGate } from '../src/features/auth/PlayerGate';

const authMock = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: unknown) => void),
  getSession: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), unsubscribe: vi.fn(),
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

it('logs in with the SDK, then reads the API profile using the current token', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn().mockResolvedValue(response(profile));
  vi.stubGlobal('fetch', fetchMock);
  authMock.signInWithPassword.mockImplementation(async () => {
    authMock.listener?.('SIGNED_IN', session);
    return { data: { session }, error: null };
  });
  mount();
  await user.type(await screen.findByLabelText('Email'), 'miso@example.com');
  await user.type(screen.getByLabelText('Mot de passe'), 'only-supabase');
  await user.click(screen.getByRole('button', { name: 'Se connecter' }));
  expect(await screen.findByText('Ton profil est prêt.')).toBeTruthy();
  expect(authMock.signInWithPassword).toHaveBeenCalledWith({ email: 'miso@example.com', password: 'only-supabase' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [, options] = fetchMock.mock.calls[0]!;
  expect(options.method).toBe('GET');
  expect(options.headers).toEqual({ Authorization: 'Bearer current-token' });
  expect(options.body).toBeUndefined();
});

it('handles confirmation email without creating a profile or game session', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  authMock.signUp.mockResolvedValue({ data: { session: null }, error: null });
  mount();
  await user.click(await screen.findByRole('button', { name: 'Créer un compte' }));
  await user.type(screen.getByLabelText('Email'), 'miso@example.com');
  await user.type(screen.getByLabelText('Mot de passe'), 'new-password');
  await user.click(screen.getByRole('button', { name: 'Créer un compte' }));
  expect(await screen.findByText(/Consulte tes emails/)).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
  expect((screen.getByLabelText('Mot de passe') as HTMLInputElement).value).toBe('');
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
  expect(screen.getByRole('button', { name: 'Se connecter' })).toBeTruthy();
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

it('supports changing an existing pseudo and logging out', async () => {
  const user = userEvent.setup();
  authMock.getSession.mockResolvedValue({ data: { session }, error: null });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(profile)).mockResolvedValueOnce(response({ ...profile, pseudo: 'Pipa' })));
  authMock.signOut.mockImplementation(async () => {
    authMock.listener?.('SIGNED_OUT', null);
    return { error: null };
  });
  mount();
  await user.click(await screen.findByRole('button', { name: 'Modifier mon pseudo' }));
  await user.clear(screen.getByLabelText('Pseudo du classement'));
  await user.type(screen.getByLabelText('Pseudo du classement'), 'Pipa');
  await user.click(screen.getByRole('button', { name: 'Enregistrer le pseudo' }));
  expect(await screen.findByRole('heading', { name: 'BONJOUR Pipa' })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Se déconnecter' }));
  expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeTruthy();
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

it('keeps navigation by keyboard and reports invalid credentials', async () => {
  const user = userEvent.setup();
  authMock.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { status: 400 } });
  mount();
  await screen.findByLabelText('Email');
  await user.tab(); expect(document.activeElement).toBe(screen.getByLabelText('Email'));
  await user.keyboard('miso@example.com');
  await user.tab(); await user.keyboard('bad-password');
  await user.tab(); await user.keyboard('{Enter}');
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('Connexion impossible.'));
});

it('unsubscribes when leaving the route', async () => {
  const { unmount } = mount();
  await screen.findByLabelText('Email');
  unmount();
  expect(authMock.unsubscribe).toHaveBeenCalledOnce();
});
