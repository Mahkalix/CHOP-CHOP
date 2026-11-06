import { LeaderboardResponseSchema, type LeaderboardResponse } from '@chopchop/shared';

export async function fetchLeaderboard(
  baseUrl: string | undefined,
  levelId: number,
  signal: AbortSignal,
): Promise<LeaderboardResponse> {
  if (!baseUrl?.trim()) {
    throw new Error('Le classement sera disponible lorsque l’API sera configurée.');
  }
  let url: URL;
  try {
    url = new URL(`${baseUrl.trim().replace(/\/+$/, '')}/leaderboard/${levelId}`);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
    url.searchParams.set('limit', '5');
  } catch {
    throw new Error('L’adresse du service de classement est invalide.');
  }
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(8_000)]) });
  } catch {
    throw new Error('Impossible de joindre le classement. Réessaie dans un instant.');
  }
  if (!response.ok) throw new Error('Le classement est temporairement indisponible.');
  const parsed = LeaderboardResponseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success || parsed.data.levelId !== levelId) {
    throw new Error('La réponse du classement est invalide. Réessaie dans un instant.');
  }
  return parsed.data;
}
