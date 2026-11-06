import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { KitchenScene } from './KitchenScene';
import styles from './Kitchen.module.scss';

export default function Kitchen() {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 1440,
      height: 900,
      parent: mount.current!,
      pixelArt: true,
      backgroundColor: '#e4d5bb',
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: KitchenScene,
    });
    return () => game.destroy(true);
  }, []);
  return <main className={styles.kitchen} aria-label="Cuisine du premier service">
    <div ref={mount} />
    <a className={styles.exit} href="#accueil">RETOUR À L’ACCUEIL</a>
    <p className={styles.hint}>ZQSD ou flèches : BOUGER</p>
  </main>;
}
