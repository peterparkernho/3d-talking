import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { VRM } from '@pixiv/three-vrm';
import { BLINK_EXPRESSION } from '@/lib/lipsync/visemeMap';

const CLOSE_MS = 60;
const OPEN_MS = 60;

export function useBlink(vrm: VRM | null) {
  const stateRef = useRef({
    nextBlinkAt: performance.now() + 1500 + Math.random() * 2000,
    phase: 'idle' as 'idle' | 'closing' | 'opening',
    phaseStartedAt: 0,
  });

  useFrame(() => {
    if (!vrm?.expressionManager) return;
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
        s.nextBlinkAt = now + 3000 + Math.random() * 3000;
        weight = 0;
      } else {
        weight = 1 - t;
      }
    }

    vrm.expressionManager.setValue(BLINK_EXPRESSION, weight);
  });
}
