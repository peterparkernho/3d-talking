import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { SkinnedMesh } from 'three';
import { getLipsync } from '@/lib/lipsync/lipsync';
import { VISEMES, type VisemeKey } from '@/lib/lipsync/visemeMap';

const DAMPING = 0.3;
const TARGET_WHEN_ACTIVE = 1.0;

interface Options {
  enabled: boolean;
}

export function useLipSync(
  meshRef: React.RefObject<SkinnedMesh | null>,
  { enabled }: Options,
) {
  const lipsync = useMemo(getLipsync, []);
  const visemeIndicesRef = useRef<Record<VisemeKey, number | undefined> | null>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh?.morphTargetDictionary) {
      visemeIndicesRef.current = null;
      return;
    }
    const dict = mesh.morphTargetDictionary;
    const map = {} as Record<VisemeKey, number | undefined>;
    for (const key of VISEMES) map[key] = dict[key];
    visemeIndicesRef.current = map;

    const missing = VISEMES.filter((k) => map[k] === undefined);
    if (missing.length) {
      console.warn('[useLipSync] missing visemes on face mesh:', missing);
    }
  }, [meshRef]);

  useFrame(() => {
    const mesh = meshRef.current;
    const map = visemeIndicesRef.current;
    if (!mesh?.morphTargetInfluences || !map) return;
    const inf = mesh.morphTargetInfluences;

    if (enabled) lipsync.processAudio();
    const dominant = enabled ? lipsync.viseme : null;

    for (const key of VISEMES) {
      const idx = map[key];
      if (idx === undefined) continue;
      const target = key === dominant ? TARGET_WHEN_ACTIVE : 0;
      inf[idx] = MathUtils.lerp(inf[idx], target, DAMPING);
    }
  });
}
