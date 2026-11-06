import type { Profile } from '@chopchop/shared';

export class ProfileError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function profileUrl() {
  const origin = import.meta.env.VITE_API_URL?.trim();
  if (!origin) throw new ProfileError(0, 'Le service joueur n’est pas encore disponible.');
  try {
    const url = new URL(`${origin.replace(/\/+$/, '')}/me`);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url;
  } catch {
    throw new ProfileError(0, 'Le service joueur n’est pas encore disponible.');
  }
}

export async function requestProfile(token: string, signal: AbortSignal, pseudo?: string): Promise<Profile | null> {
  let response: Response;
  const url = profileUrl();
  try {
    response = await fetch(url, {
      method: pseudo === undefined ? 'GET' : 'PUT', signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(pseudo === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(pseudo === undefined ? {} : { body: JSON.stringify({ pseudo }) }),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ProfileError(0, 'Impossible de joindre le service joueur. Réessaie.');
  }
  if (response.status === 404 && pseudo === undefined) {
    const body: unknown = await response.json().catch(() => null);
    // Match the current API contract, not a proxy or static host's generic 404.
    if (body && typeof body === 'object' && 'error' in body && body.error === 'Profile not created yet') return null;
    throw new ProfileError(404, 'Le service joueur est mal configuré. Réessaie plus tard.');
  }
  if (response.status === 401) throw new ProfileError(401, 'Ta session a expiré. Reconnecte-toi pour continuer.');
  if (response.status === 409) throw new ProfileError(409, 'Ce pseudo est déjà pris. Choisis-en un autre.');
  if (!response.ok) throw new ProfileError(response.status, 'Impossible de charger ou enregistrer ton profil. Réessaie.');
  const data: unknown = await response.json().catch(() => null);
  if (!data || typeof data !== 'object' || !('id' in data) || typeof data.id !== 'string'
    || !('pseudo' in data) || typeof data.pseudo !== 'string') {
    throw new ProfileError(0, 'Le service joueur a renvoyé une réponse invalide. Réessaie.');
  }
  return { id: data.id, pseudo: data.pseudo };
}
