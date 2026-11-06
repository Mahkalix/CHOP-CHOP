import { useState } from 'react';
import s from './Selection.module.scss';

const chefs = ['Miso','Pipa','Basile','Alba','Nori','Gaspard'];
export function HomePage() {
  const [chef, setChef] = useState(() => Math.max(0, chefs.indexOf(sessionStorage.getItem('chef') ?? '')));
  const [name, setName] = useState(() => sessionStorage.getItem('pseudo') ?? '');
  function select(index: number) {
    const next = (index + chefs.length) % chefs.length;
    setChef(next); sessionStorage.setItem('chef', chefs[next]!);
  }
  return <main className={s.menu}>
    <h1><img src="/menu/logo.png" alt="CHOP CHOP" /></h1>
    <div className={s.columns}>
      <section className={s.level}><h2>01 / PREMIER COUP DE FEU <time>03:00</time></h2>
        <img className={s.map} src="/menu/kitchen.png" alt="Aperçu de la cuisine du premier service" />
        <div className={s.stars}>{['300','600','1 000'].map((score,i)=><div key={score}><span aria-label={`${i+1} étoiles`}>{Array.from({length:i+1},(_,j)=><img key={j} src="/menu/star.svg" alt="" />)}</span>{score} pts</div>)}</div>
      </section>
      <section className={s.selection}>
        <label>Ton prénom ou pseudo<input placeholder="Ex. Alex" value={name} maxLength={16} onChange={e=>{setName(e.target.value);sessionStorage.setItem('pseudo',e.target.value);}} /></label>
        <h2>CHOISIS TON CHEF</h2><h3 aria-live="polite">{chefs[chef]!.toUpperCase()}</h3>
        <div className={s.carousel}><button aria-label="Chef précédent" onClick={()=>select(chef-1)}>&lt;</button><img src={`/menu/${chefs[chef]}.png`} alt={chefs[chef]} /><button aria-label="Chef suivant" onClick={()=>select(chef+1)}>&gt;</button></div>
        <div className={s.thumbs}>{chefs.map((c,i)=><button key={c} aria-label={c} aria-pressed={i===chef} onClick={()=>select(i)}><img src={`/menu/${c}.png`} alt="" /></button>)}</div>
        <small>{chef+1} / 6 CHEFS</small>
      </section>
    </div>
    <nav className={s.actions} aria-label="Menu principal"><a href="#jouer">JOUER</a><a href="#regles">COMMENT JOUER</a><a href="#classement">CLASSEMENT</a></nav>
    <footer>CHOP CHOP · Projet étudiant · 2026</footer>
  </main>;
}
