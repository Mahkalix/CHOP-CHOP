import { useState } from 'react';
import { StatCard } from '../../components/StatCard/StatCard';
import styles from './HomePage.module.scss';

const levels = ['Le marche', 'Le bistrot', 'La grande table'];

export function HomePage() {
  const [selectedLevel, setSelectedLevel] = useState(0);

  return (
    <main className={styles.page}>
      cc
    </main>
  );
}
