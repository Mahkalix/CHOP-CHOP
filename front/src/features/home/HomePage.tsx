import styles from './HomePage.module.scss';

export function HomePage() {
  return <>
    <p className={styles.intro}>Découpe, cuisine, assemble. Trois minutes pour garder la tête froide et envoyer un maximum d’assiettes en salle.</p>
    <div className={styles.actions}>
      <a className={styles.primaryButton} href="#jouer">JOUER <span aria-hidden="true">↗</span></a>
      <a className={styles.secondaryButton} href="#regles">COMMENT JOUER</a>
      <a className={styles.secondaryButton} href="#classement">CLASSEMENT</a>
    </div>
    <section className={styles.cards} aria-label="Les étapes du service">
      {[['01', 'DÉCOUPE', 'Prépare tes ingrédients.'], ['02', 'CUISINE', 'Surveille la cuisson.'], ['03', 'ENVOIE', 'La salle attend ses plats.']].map(([number, title, text]) => <article key={number}><span className={styles.eyebrow}>{number} / LE SERVICE</span><h2>{title}</h2><p>{text}</p></article>)}
    </section>
  </>;
}
