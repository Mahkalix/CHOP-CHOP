import styles from './StatCard.module.scss';

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className={styles.card}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
      <span className={styles.detail}>{detail}</span>
    </article>
  );
}
