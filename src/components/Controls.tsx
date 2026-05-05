import styles from './Controls.module.css';

interface ControlsProps {
  isPlaying: boolean;
  isReady: boolean;
  isMuted: boolean;
  onToggle: () => void;
  onToggleMute: () => void;
}

export default function Controls({
  isPlaying,
  isReady,
  isMuted,
  onToggle,
  onToggleMute,
}: ControlsProps) {
  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.btn}
        onClick={onToggle}
        disabled={!isReady}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnGhost}`}
        onClick={onToggleMute}
        disabled={!isReady}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        aria-pressed={isMuted}
      >
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
}
