import { useEffect, useRef, useState } from 'react';
import { HomePage } from '../features/home/HomePage';
import styles from '../features/home/HomePage.module.scss';

type Route = 'accueil' | 'jouer' | 'regles' | 'classement';
const routes: Route[] = ['accueil', 'jouer', 'regles', 'classement'];
function readRoute(): Route {
  const value = window.location.hash.slice(1) as Route;
  return routes.includes(value) ? value : 'accueil';
}
const titles: Record<Route, string> = { accueil: 'À vos fourneaux !', jouer: 'Préparer le service', regles: 'Comment jouer', classement: 'Le classement' };

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
  return <div className={styles.page}>
    <a className={styles.skipLink} href="#contenu" onClick={event => { event.preventDefault(); document.getElementById('contenu')?.focus(); }}>Aller au contenu</a>
    <header className={styles.header}>
      <a className={styles.brand} href="#accueil" aria-label="CHOP CHOP — Accueil">CHOP CHOP<span aria-hidden="true">✳</span></a>
      <nav aria-label="Navigation principale">{routes.map(item => <a key={item} href={`#${item}`} aria-current={route === item ? 'page' : undefined}>{item === 'regles' ? 'Règles' : item.charAt(0).toUpperCase() + item.slice(1)}</a>)}</nav>
      <span className={styles.status}>SOLO · 3 MINUTES</span>
    </header>
    <main id="contenu" tabIndex={-1} className={styles.content}>
      <p className={styles.eyebrow}>UN SERVICE. UN CHEF. À TOI DE JOUER.</p>
      <h1 ref={heading} tabIndex={-1}>{titles[route]}</h1>
      {route === 'regles' ? <section className={styles.panel} aria-label="Règles du jeu">
        <p>Sers les bonnes assiettes avant la fin des trois minutes.</p>
        <dl><dt>ZQSD / flèches</dt><dd>Déplacer le chef.</dd><dt>E</dt><dd>Prendre, poser, assembler et servir.</dd><dt>C maintenue</dt><dd>Découper pendant 3 secondes, les mains libres.</dd></dl>
        <ol><li>Prends une tomate avec E.</li><li>Pose-la sur la planche avec E, puis maintiens C pour la découper.</li><li>Pose une assiette au poste ASSEMBLER et ajoutes-y la tomate.</li><li>Apporte l’assiette au poste SERVIR, vers la salle à droite.</li></ol>
        <a className={styles.primaryButton} href="#jouer">Préparer le service →</a>
      </section> : route === 'classement' ? <section className={styles.panel} aria-label="Classement">
        <p className={styles.eyebrow}>LES MEILLEURS SERVICES</p><h2>Le tableau attend ses chefs.</h2>
        <p>Le classement sera disponible après le raccordement à l’API des scores.</p><a className={styles.primaryButton} href="#jouer">Aller au service →</a>
      </section> : <section className={styles.panel} aria-label="Lancement du jeu">
        <p className={styles.eyebrow}>01 / PREMIER COUP DE FEU</p><h2>La cuisine se prépare.</h2>
        <p>Le moteur de jeu sera intégré ici. Les déplacements et les recettes arrivent dans les prochaines étapes du projet.</p>
        <button className={styles.primaryButton} disabled>Démarrer — bientôt disponible</button><p><a href="#regles">Découvrir les commandes →</a></p>
      </section>}
    </main>
    <footer className={styles.footer}><span>CHOP CHOP / LE COUP DE FEU COMMENCE ICI.</span><span>Jeu solo · Clavier requis</span></footer>
  </div>;
}
