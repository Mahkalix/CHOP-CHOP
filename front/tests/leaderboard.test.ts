import { afterEach, expect, it, vi } from 'vitest';
import { fetchLeaderboard } from '../src/features/leaderboard/api';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const signal = () => new AbortController().signal;
const entry = { rank: 2, pseudo: 'Camille', score: 450, durationMs: 180000, finishedAt: '2026-11-06T10:00:00Z' };

it('requests the selected level and preserves server ranks and ordering', async () => {
  const data = { levelId: 3, entries: [entry, { ...entry, pseudo: 'Alex', rank: 3, score: 400 }] };
  const fetchMock = vi.fn().mockResolvedValue(Response.json(data));
  vi.stubGlobal('fetch', fetchMock);
  const abortSignal = signal();
  expect(await fetchLeaderboard('https://api.example.com/', 3, abortSignal)).toEqual(data);
  expect(String(fetchMock.mock.calls[0]![0])).toBe('https://api.example.com/leaderboard/3?limit=5');
  expect(fetchMock.mock.calls[0]![1]).toEqual({ signal: expect.any(AbortSignal) });
});

it('accepts an empty leaderboard', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ levelId: 1, entries: [] })));
  expect((await fetchLeaderboard('https://api.example.com', 1, signal())).entries).toEqual([]);
});

it.each([undefined, '', 'file:///tmp/api', 'not a url'])('rejects missing or invalid configuration: %s', async base => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await expect(fetchLeaderboard(base, 1, signal())).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([
  new Response('', { status: 503 }),
  new Response('not json'),
  Response.json({ levelId: 2, entries: [] }),
  Response.json({ levelId: 1, entries: [{ ...entry, score: '450' }] }),
])('rejects unavailable, malformed or wrong-level responses', async response => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
  await expect(fetchLeaderboard('https://api.example.com', 1, signal())).rejects.toThrow();
});

it('handles network failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
  await expect(fetchLeaderboard('https://api.example.com', 1, signal())).rejects.toThrow('Impossible de joindre');
});

it('passes cancellation to the request', async () => {
  const controller = new AbortController();
  vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  })));
  const request = fetchLeaderboard('https://api.example.com', 1, controller.signal);
  controller.abort();
  await expect(request).rejects.toThrow();
});

it('times out a stalled API and allows callers to retry', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  })));
  const request = fetchLeaderboard('https://api.example.com', 1, signal());
  const failed = expect(request).rejects.toThrow('trop de temps');
  await vi.advanceTimersByTimeAsync(8_000);
  await failed;
  expect(vi.getTimerCount()).toBe(0);
});

it('validates level ids against the shared API contract', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ levelId: 999, entries: [] })));
  await expect(fetchLeaderboard('https://api.example.com', 999, signal())).rejects.toThrow('invalide');
});
