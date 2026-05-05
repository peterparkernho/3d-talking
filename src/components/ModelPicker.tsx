import { AVATAR_PRESETS } from '@/lib/avatar/presets';
import styles from './ModelPicker.module.css';

interface ModelPickerProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ModelPicker({ value, onChange }: ModelPickerProps) {
  const known = AVATAR_PRESETS.find((p) => p.url === value);

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Model</span>
      <select
        className={styles.select}
        value={known ? known.url : ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {!known && (
          <option value="" disabled>
            Custom (VITE_AVATAR_URL)
          </option>
        )}
        {AVATAR_PRESETS.map((p) => (
          <option key={p.id} value={p.url}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
