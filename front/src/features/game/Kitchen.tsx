import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Phaser from 'phaser';
import { KitchenScene, type InteractionStatus } from './KitchenScene';
import styles from './Kitchen.module.scss';

export default function Kitchen() {
  const mount = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<InteractionStatus>({ carried: null, target: null, message: 'Approche-toi d’un poste puis appuie sur E.', preparation: null });
  useEffect(() => {
    let game: Phaser.Game | undefined;
    // Defer creation so StrictMode can clean up its first effect before Phaser boots.
    const frame = requestAnimationFrame(() => {
      game = new Phaser.Game({
        type: Phaser.AUTO,
        scale: { mode: Phaser.Scale.RESIZE },
        parent: mount.current!,
        pixelArt: true,
        backgroundColor: '#e4d5bb',
        physics: { default: 'arcade', arcade: { debug: false } },
        scene: KitchenScene,
      });
      game.events.on('kitchen-interaction', setStatus);
    });
    return () => {
      cancelAnimationFrame(frame);
      game?.events.off('kitchen-interaction', setStatus);
      game?.destroy(true);
    };
  }, []);
  return createPortal(<main className={styles.kitchen} aria-label="Cuisine du premier service">
    <div className={styles.canvas} ref={mount} />
    <a className={styles.exit} href="#accueil">RETOUR À L’ACCUEIL</a>
    {document.fullscreenEnabled && <button className={styles.fullscreen} onClick={event => {
      const frame = event.currentTarget.closest('main');
      if (document.fullscreenElement) void document.exitFullscreen();
      else if (frame) void frame.requestFullscreen().catch(() => {});
    }}>PLEIN ÉCRAN</button>}
    <section className={styles.inventory} aria-label="Objet porté">
      <strong>EN MAIN : {status.carried ?? 'Rien'}</strong>
      <p>{status.target ? `POSTE : ${status.target}` : 'Approche-toi d’un poste.'}</p>
      <p role="status">{status.message}</p>
      {status.preparation && <div className={styles.preparation}>
        <span>{status.preparation.label} · {status.preparation.percent}%</span>
        <div role="progressbar" aria-label={status.preparation.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={status.preparation.percent}>
          <span style={{ width: `${status.preparation.percent}%` }} />
        </div>
      </div>}
    </section>
    <p className={styles.hint}>ZQSD ou flèches : BOUGER · ESPACE : BONDIR · E : PRENDRE / POSER · Maintenir C : DÉCOUPER</p>
  </main>, document.body);
}
