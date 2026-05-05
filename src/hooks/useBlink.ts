import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { SkinnedMesh } from 'three';
import { BLINK_KEYS } from '@/lib/lipsync/visemeMap';

const CLOSE_MS = 60;
const OPEN_MS = 60;

export function useBlink(meshRef: React.RefObject<SkinnedMesh | null>) {
  const stateRef = useRef({
    nextBlinkAt: performance.now() + 1500,
    phase: 'idle' as 'idle' | 'closing' | 'opening',
    phaseStartedAt: 0,
  });

  useEffect(() => {
    stateRef.current.nextBlinkAt = performance.now() + 1500 + Math.random() * 2000;
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh?.morphTargetDictionary || !mesh.morphTargetInfluences) return;
    const dict = mesh.morphTargetDictionary;
    const inf = mesh.morphTargetInfluences;
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

    for (const key of BLINK_KEYS) {
      const idx = dict[key];
      if (idx !== undefined) inf[idx] = weight;
    }
  });
}
