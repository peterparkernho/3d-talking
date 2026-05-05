import { EMOTIONS, type EmotionName } from '@/lib/avatar/emotions';
import styles from './EmotionPicker.module.css';

interface EmotionPickerProps {
  value: EmotionName;
  onChange: (next: EmotionName) => void;
}

export default function EmotionPicker({ value, onChange }: EmotionPickerProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Emotion</span>
      {EMOTIONS.map((e) => (
        <button
          key={e}
          type="button"
          className={styles.btn}
          aria-pressed={e === value}
          onClick={() => onChange(e)}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
