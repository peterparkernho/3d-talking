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

type IndexLookup = Map<SkinnedMesh, Partial<Record<VisemeKey, number>>>;

export function useLipSync(
  meshesRef: React.RefObject<SkinnedMesh[]>,
  { enabled }: Options,
) {
  const lipsync = useMemo(getLipsync, []);
  const lookupRef = useRef<IndexLookup | null>(null);

  useEffect(() => {
    const meshes = meshesRef.current ?? [];
    const lookup: IndexLookup = new Map();
    for (const mesh of meshes) {
      const dict = mesh.morphTargetDictionary;
      if (!dict) continue;
      const map: Partial<Record<VisemeKey, number>> = {};
      let any = false;
      for (const key of VISEMES) {
        const idx = dict[key];
        if (idx !== undefined) {
          map[key] = idx;
          any = true;
        }
      }
      if (any) lookup.set(mesh, map);
    }
    lookupRef.current = lookup;

    if (lookup.size === 0) {
      console.warn('[useLipSync] no meshes with viseme_* morph targets.');
    }
  }, [meshesRef]);

  useFrame(() => {
    const lookup = lookupRef.current;
    if (!lookup) return;

    if (enabled) lipsync.processAudio();
    const dominant = enabled ? lipsync.viseme : null;

    lookup.forEach((map, mesh) => {
      const inf = mesh.morphTargetInfluences;
      if (!inf) return;
      for (const key of VISEMES) {
        const idx = map[key];
        if (idx === undefined) continue;
        const target = key === dominant ? TARGET_WHEN_ACTIVE : 0;
        inf[idx] = MathUtils.lerp(inf[idx], target, DAMPING);
      }
    });
  });
}
