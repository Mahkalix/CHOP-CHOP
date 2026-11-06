import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './index.module.css';

const cards = [
  {title: 'Préparer', text: 'Découper la tomate, cuire la viande et assembler des recettes exactes.', to: '/docs/gameplay', label: 'Explorer le gameplay'},
  {title: 'Livrer', text: 'Répondre aux commandes à temps et enchaîner les livraisons pour augmenter le combo.', to: '/docs/score', label: 'Comprendre le score'},
  {title: 'Se classer', text: 'Comparer son score à celui des autres joueurs du même niveau.', to: '/docs/classement', label: 'Découvrir le classement'},
];
export default function Home(): ReactNode {
  return <Layout title="Documentation du jeu web" description="CHOP-CHOP : jeu de cuisine solo en 2D, équipe, gameplay, trois niveaux prévus et classement par niveau.">
    <header className={styles.hero}>
      <div className={`container ${styles.heroInner}`}>
        <div>
        <p className={styles.eyebrow}>DOCUMENTATION DU JEU WEB</p>
        <Heading as="h1" className={styles.title}>
          <img className={styles.brandBanner} src={useBaseUrl('/img/chopchop-banner.svg')} alt="CHOP-CHOP" width="628" height="234" />
        </Heading>
        <p className={styles.subtitle}>La cuisine s’active.<br/>Le chrono tourne.</p>
        <p className={styles.description}>Un personnage, une cuisine et des commandes à servir. Préparez les plats, enchaînez les livraisons et visez le classement de chaque niveau.</p>
        <div className={styles.actions}>
          <Link className="button button--primary button--lg" to="/docs/intro">Découvrir le projet</Link>
          <Link className="button button--outline button--primary button--lg" to="/docs/regles-du-jeu">Règles du jeu</Link>
          <Link className="button button--outline button--primary button--lg" to="/docs/cas-utilisation">Les 54 cas d’utilisation</Link>
        </div>
        <p className={styles.meta}>Solo · Ordinateur · Clavier · 3 niveaux prévus</p>
        </div>
        <aside className={styles.overview} aria-labelledby="overview-title">
          <Heading as="h2" id="overview-title" className={styles.overviewTitle}>Le projet en un coup d’œil</Heading>
          <dl className={styles.stats}>
            <div className={styles.stat}><dt>01</dt><dd>cuisine, un défi en solo</dd></div>
            <div className={styles.stat}><dt>54</dt><dd>cas d’utilisation documentés</dd></div>
            <div className={styles.stat}><dt>04</dt><dd>filles aux commandes du projet</dd></div>
          </dl>
          <Link to="/docs/design">Explorer les maquettes et l’identité visuelle →</Link>
          <div className={styles.progress} aria-hidden="true" />
          <p className={styles.overviewCaption}>Mise en place… du projet à la cuisine.</p>
        </aside>
      </div>
    </header>
    <main className={`container ${styles.main}`}>
      <section aria-labelledby="gameplay-title">
        <Heading as="h2" id="gameplay-title" className={styles.sectionTitle}>À chaque étape, son objectif</Heading>
        <div className={styles.cards}>{cards.map((card, index) => <article className={styles.card} key={card.title}>
          <span className={styles.cardNumber} aria-hidden="true">0{index + 1}</span>
          <Heading as="h3">{card.title}</Heading><p>{card.text}</p><Link to={card.to}>{card.label} →</Link>
        </article>)}</div>
      </section>
      <section className={styles.note}>
        <Heading as="h2">Un cadrage à valider ensemble</Heading>
        <p>Le projet prévoit trois niveaux, Supabase Auth et une API Fastify déjà présente dans le code. React porte les menus et interfaces ; Phaser porte la cuisine et les interactions. La durée définitive, les recettes et les barèmes restent à valider.</p>
        <Link to="/docs/validation">Consulter les décisions et les critères du prototype →</Link>
      </section>
    </main>
  </Layout>;
}
