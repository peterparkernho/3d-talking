import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { AvatarRig } from '@/lib/avatar/rig';

const CLOSE_MS = 60;
const OPEN_MS = 60;

/** Idle blink interval (ms): random in [min, max]. */
const IDLE_MIN_MS = 3000;
const IDLE_MAX_MS = 6000;

/** While speaking, humans blink ~2× more often. Same shape, tighter range. */
const SPEAKING_MIN_MS = 1200;
const SPEAKING_MAX_MS = 2800;

function nextInterval(speaking: boolean): number {
  const min = speaking ? SPEAKING_MIN_MS : IDLE_MIN_MS;
  const max = speaking ? SPEAKING_MAX_MS : IDLE_MAX_MS;
  return min + Math.random() * (max - min);
}

export function useBlink(rig: AvatarRig | null, isSpeaking = false) {
  const stateRef = useRef({
    nextBlinkAt: performance.now() + nextInterval(false),
    phase: 'idle' as 'idle' | 'closing' | 'opening',
    phaseStartedAt: 0,
  });
  const speakingRef = useRef(isSpeaking);
  speakingRef.current = isSpeaking;

  useFrame(() => {
    if (!rig) return;
    const now = performance.now();
    const s = stateRef.current;

    if (s.phase === 'idle' && now >= s.nextBlinkAt) {
      s.phase = 'closing';
      s.phaseStartedAt = now;
    }

    let weight = 0;
    if (s.phase === 'closing') {
      const t = (now - s.phaseStartedAt) / CLOSE_MS;
      if (t >= 1) {
        s.phase = 'opening';
        s.phaseStartedAt = now;
        weight = 1;
      } else {
        weight = t;
      }
    } else if (s.phase === 'opening') {
      const t = (now - s.phaseStartedAt) / OPEN_MS;
      if (t >= 1) {
        s.phase = 'idle';
        s.nextBlinkAt = now + nextInterval(speakingRef.current);
        weight = 0;
      } else {
        weight = 1 - t;
      }
    }

    rig.applyBlink(weight);
  });
}
