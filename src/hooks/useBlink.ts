import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { SkinnedMesh } from 'three';
import { BLINK_KEYS } from '@/lib/lipsync/visemeMap';

const CLOSE_MS = 60;
const OPEN_MS = 60;

type BlinkLookup = Map<SkinnedMesh, number[]>;

export function useBlink(meshesRef: React.RefObject<SkinnedMesh[]>) {
  const stateRef = useRef({
    nextBlinkAt: performance.now() + 1500 + Math.random() * 2000,
    phase: 'idle' as 'idle' | 'closing' | 'opening',
    phaseStartedAt: 0,
  });
  const lookupRef = useRef<BlinkLookup | null>(null);

  useEffect(() => {
    const meshes = meshesRef.current ?? [];
    const lookup: BlinkLookup = new Map();
    for (const mesh of meshes) {
      const dict = mesh.morphTargetDictionary;
      if (!dict) continue;
      const indices: number[] = [];
      for (const key of BLINK_KEYS) {
        const idx = dict[key];
        if (idx !== undefined) indices.push(idx);
      }
      if (indices.length) lookup.set(mesh, indices);
    }
    lookupRef.current = lookup;
  }, [meshesRef]);

  useFrame(() => {
    const lookup = lookupRef.current;
    if (!lookup || lookup.size === 0) return;
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

    lookup.forEach((indices, mesh) => {
      const inf = mesh.morphTargetInfluences;
      if (!inf) return;
      for (const idx of indices) inf[idx] = weight;
    });
  });
}
