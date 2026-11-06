import { useEffect, useRef, useState } from 'react';
import { Ranking } from '../features/leaderboard/Ranking';
import { HomePage } from '../features/home/HomePage';
import styles from '../features/home/HomePage.module.scss';

type Route = 'accueil' | 'jouer' | 'regles' | 'classement';
const routes: Route[] = ['accueil', 'jouer', 'regles', 'classement'];
function readRoute(): Route {
  const value = window.location.hash.slice(1) as Route;
  return routes.includes(value) ? value : 'accueil';
}
const titles: Record<Route, string> = { accueil: 'Accueil', jouer: 'Mise en place…', regles: 'Comment jouer', classement: 'Le classement' };

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const update = () => setRoute(readRoute());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    document.title = `${titles[route]} · CHOP CHOP`;
    heading.current?.focus();
  }, [route]);
  if (route === 'accueil') return <HomePage />;
  const backLabel = route === 'regles' ? 'COMPRIS, RETOUR' : route === 'jouer' ? 'RETOUR À L’ACCUEIL' : 'RETOUR';
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        {route !== 'jouer' && <img src="/menu/logo.png" alt="CHOP CHOP" />}
        <h1 ref={heading} tabIndex={-1}>{titles[route].toUpperCase()}</h1>
      </header>
      {route === 'regles' && <Rules />}
      {route === 'classement' && <Ranking />}
      {route === 'jouer' && <section className={styles.loading}>
        <h2>La cuisine se prépare.</h2>
        <p>Les commandes arrivent, à toi de jouer !</p>
      </section>}
      <a className={styles.back} href="#accueil">{backLabel}</a>
    </main>
  );
}

const steps = [
  ['1 / PRENDS UNE TOMATE', 'Approche-toi du bac TOMATES. Appuie sur E pour prendre une tomate.'],
  ['2 / DÉCOUPE-LA', 'À la planche : E pour poser la tomate. Puis maintiens C pendant 3 s, les mains libres.'],
  ['3 / PRÉPARE L’ASSIETTE', 'Pose une assiette au poste ASSEMBLER. Reprends la tomate découpée à la planche, puis pose-la sur l’assiette avec E.'],
  ['4 / SERS LA COMMANDE', 'Prends l’assiette terminée. Va au poste SERVIR et appuie sur E. La bonne recette rapporte des points !'],
];

function Rules() {
  return <>
    <p>TON BUT : servir les bonnes assiettes avant la fin des 3 minutes.</p>
    <div className={styles.row}>
      {[['Z Q S D ou ↑ ← ↓ →', 'Se déplacer'], ['E', 'Prendre / poser', 'Appui simple'], ['C', 'Découper', 'Maintenir 3 secondes'], ['Esc', 'Pause']].map(([key, label, hint]) =>
        <section key={key}><kbd>{key}</kbd><h3>{label}</h3>{hint}</section>
      )}
    </div>
    <h2>TA PREMIÈRE COMMANDE : UNE ASSIETTE DE TOMATE</h2>
    <div className={styles.row}>{steps.map(([title, body]) =>
      <section key={title}><h3>{title}</h3><p>{body}</p></section>
    )}</div>
    <div className={styles.row}>
      <section><h3>LES 3 RECETTES</h3>Tomate : assiette + tomate découpée<br/>Viande : assiette + viande cuite<br/>Mixte : assiette + tomate découpée + viande cuite</section>
      <section><h3>À RETENIR</h3>Un seul objet porté à la fois. Pose-le avant d’en prendre un autre.<br/>Viande : pose-la sur le feu, attends 8 s, puis récupère-la.<br/>Après 6 s de plus, elle brûle : direction la poubelle.</section>
    </div>
  </>;
}
