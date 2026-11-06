import { useEffect, useState } from 'react';
import type { LeaderboardEntry, LeaderboardResponse } from '@chopchop/shared';
import { fetchLeaderboard } from './api';
import styles from './Ranking.module.scss';

type Result =
  | { status: 'loading' }
  | { status: 'success'; data: LeaderboardResponse }
  | { status: 'error'; message: string };

export function Ranking() {
  if (!import.meta.env.VITE_API_URL?.trim()) {
    return <section className={styles.upcoming} aria-labelledby="ranking-soon">
      <img src="/menu/star.svg" alt="" width="48" height="48" />
      <h2 id="ranking-soon">Classement indisponible</h2>
      <p role="alert">Le service de classement n’est pas configuré. Réessaie plus tard.</p>
    </section>;
  }
  return <LiveRanking />;
}

function LiveRanking() {
  const [level, setLevel] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setResult({ status: 'loading' });
    fetchLeaderboard(import.meta.env.VITE_API_URL, level, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setResult({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setResult({ status: 'error', message: error instanceof Error ? error.message : 'Classement indisponible.' });
        }
      });
    return () => controller.abort();
  }, [level, attempt]);

  function changeLevel(value: number) {
    setResult({ status: 'loading' });
    setLevel(value);
  }

  return <section className={styles.ranking} aria-label="Classement par niveau">
    <label htmlFor="ranking-level">NIVEAU </label>
    <select id="ranking-level" value={level} onChange={event => changeLevel(Number(event.target.value))}>
      {[1, 2, 3].map(id => <option key={id} value={id}>Niveau {id}</option>)}
    </select>
    <h2 className={styles.title}>TOP 5 · LES AS DU FOURNEAU</h2>
    <div aria-live="polite" aria-busy={result.status === 'loading'}>
      {result.status === 'loading' && <p>Chargement du classement…</p>}
      {result.status === 'error' && <>
        <p role="alert">{result.message}</p>
        <button onClick={() => { setResult({ status: 'loading' }); setAttempt(value => value + 1); }}>Réessayer</button>
      </>}
      {result.status === 'success' && (result.data.entries.length === 0
        ? <p>Aucun score classé pour ce niveau pour le moment.</p>
        : <><Podium entries={result.data.entries} /><div className={styles.tableWrapper}><table>
          <caption>Les cinq meilleurs joueurs du niveau {level}</caption>
          <thead><tr><th scope="col">RANG</th><th scope="col">JOUEUR</th><th scope="col">POINTS</th></tr></thead>
          <tbody>{result.data.entries.map(entry => <tr key={entry.rank}>
            <td>{entry.rank}</td><th scope="row">{entry.pseudo}</th><td>{entry.score}</td>
          </tr>)}</tbody>
        </table></div></>)}
    </div>
    <p>Un meilleur score par joueur et par niveau. Départage par durée, puis par date.</p>
  </section>;
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const winners = entries.slice(0, 3);
  const ordered = winners.length === 3 ? [winners[1]!, winners[0]!, winners[2]!] : winners;
  return <div className={styles.podium} aria-label="Podium du niveau">
    {ordered.map(entry => <section key={entry.rank} className={entry.rank === 1 ? styles.winner : undefined}>
      <h3>{String(entry.rank).padStart(2, '0')} / {entry.rank === 1 ? 'MEILLEUR SCORE' : 'PODIUM'}</h3>
      <strong>{entry.pseudo}</strong><p>{entry.score} pts</p>
    </section>)}
  </div>;
}
