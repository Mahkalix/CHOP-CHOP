import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Phaser from 'phaser';
import { KitchenScene } from './KitchenScene';
import styles from './Kitchen.module.scss';

export default function Kitchen() {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      scale: { mode: Phaser.Scale.RESIZE },
      parent: mount.current!,
      pixelArt: true,
      backgroundColor: '#e4d5bb',
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: KitchenScene,
    });
    return () => game.destroy(true);
  }, []);
  return createPortal(<main className={styles.kitchen} aria-label="Cuisine du premier service">
    <div className={styles.canvas} ref={mount} />
    <a className={styles.exit} href="#accueil">RETOUR À L’ACCUEIL</a>
    {document.fullscreenEnabled && <button className={styles.fullscreen} onClick={event => {
      const frame = event.currentTarget.closest('main');
      if (document.fullscreenElement) void document.exitFullscreen();
      else if (frame) void frame.requestFullscreen().catch(() => {});
    }}>PLEIN ÉCRAN</button>}
    <p className={styles.hint}>ZQSD ou flèches : BOUGER · ESPACE : BONDIR</p>
  </main>, document.body);
}
