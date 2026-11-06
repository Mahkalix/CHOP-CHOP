import { useEffect, useState } from 'react';
import type { LeaderboardResponse } from '@chopchop/shared';
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
      <h2 id="ranking-soon">Le classement arrive bientôt</h2>
      <p>Retrouve ici les meilleurs scores de chaque niveau dès l’ouverture du classement.</p>
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
    <h2>TOP 5 · LES AS DU FOURNEAU</h2>
    <div aria-live="polite" aria-busy={result.status === 'loading'}>
      {result.status === 'loading' && <p>Chargement du classement…</p>}
      {result.status === 'error' && <>
        <p role="alert">{result.message}</p>
        <button onClick={() => { setResult({ status: 'loading' }); setAttempt(value => value + 1); }}>Réessayer</button>
      </>}
      {result.status === 'success' && (result.data.entries.length === 0
        ? <p>Aucune partie classée pour ce niveau pour le moment.</p>
        : <div className={styles.tableWrapper}><table>
          <caption>Les cinq premières parties du niveau {level}</caption>
          <thead><tr><th scope="col">RANG</th><th scope="col">JOUEUR</th><th scope="col">POINTS</th></tr></thead>
          <tbody>{result.data.entries.map((entry, index) => <tr key={index}>
            <td>{entry.rank}</td><th scope="row">{entry.pseudo}</th><td>{entry.score}</td>
          </tr>)}</tbody>
        </table></div>)}
    </div>
    <p>Parties classées par score, puis par durée. Un joueur peut apparaître plusieurs fois.</p>
  </section>;
}
