import { useState } from 'react';
import styles from './ChatBar.module.css';

interface ChatBarProps {
  mode: 'rest' | 'ws' | 'demo';
  isSending: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  lastReply: string;
  onSend: (text: string) => void;
  onStop: () => void;
  onToggleMute: () => void;
}

export default function ChatBar({
  mode,
  isSending,
  isPlaying,
  isMuted,
  lastReply,
  onSend,
  onStop,
  onToggleMute,
}: ChatBarProps) {
  const [draft, setDraft] = useState('');
  const placeholder =
    mode === 'demo' ? 'Type anything (demo replies with sample.mp3)…' : 'Say something…';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isSending) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <div className={styles.wrap}>
      {lastReply && <div className={styles.reply}>{lastReply}</div>}
      <form className={styles.bar} onSubmit={handleSubmit}>
        <span className={styles.tag} data-mode={mode}>
          {mode}
        </span>
        <input
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          disabled={isSending}
          autoComplete="off"
        />
        <button
          type="submit"
          className={styles.btn}
          disabled={isSending || !draft.trim()}
          aria-label="Send"
        >
          {isSending ? '…' : 'Send'}
        </button>
        {isPlaying && (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onStop}
            aria-label="Stop"
          >
            Stop
          </button>
        )}
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={onToggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </form>
    </div>
  );
}
