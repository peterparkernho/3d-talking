import styles from './StartGate.module.css';

interface StartGateProps {
  onStart: () => void;
  isReady: boolean;
}

export default function StartGate({ onStart, isReady }: StartGateProps) {
  return (
    <div className={styles.gate}>
      <div className={styles.glow} aria-hidden />
      <h1 className={styles.title}>3D Talking Character</h1>
      <p className={styles.subtitle}>Click Start to enable audio + lip-sync</p>
      <button
        type="button"
        className={styles.btn}
        onClick={onStart}
        disabled={!isReady}
      >
        {isReady ? 'Start' : 'Loading…'}
      </button>
    </div>
  );
}
