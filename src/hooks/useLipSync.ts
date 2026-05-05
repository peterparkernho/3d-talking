import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { SkinnedMesh } from 'three';
import { getLipsync } from '@/lib/lipsync/lipsync';
import { VISEMES, type VisemeKey } from '@/lib/lipsync/visemeMap';

// Asymmetric damping per state, mirroring the wawa-lipsync demo.
// Vowels are sustained shapes — glide. Consonants are quick — snap.
const ACTIVE_DAMP = { vowel: 0.2, other: 0.4 };
const RELEASE_DAMP = { vowel: 0.1, other: 0.2 };

interface Options {
  enabled: boolean;
}

type IndexLookup = Map<SkinnedMesh, Partial<Record<VisemeKey, number>>>;

interface InternalLipsync {
  state: 'silence' | 'vowel' | 'plosive' | 'fricative';
  viseme: VisemeKey;
}

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
    const ls = lipsync as unknown as InternalLipsync;
    const dominant = enabled ? ls.viseme : null;
    const state = enabled ? ls.state : 'silence';

    const activeSpeed = state === 'vowel' ? ACTIVE_DAMP.vowel : ACTIVE_DAMP.other;
    const releaseSpeed = state === 'vowel' ? RELEASE_DAMP.vowel : RELEASE_DAMP.other;

    lookup.forEach((map, mesh) => {
      const inf = mesh.morphTargetInfluences;
      if (!inf) return;
      for (const key of VISEMES) {
        const idx = map[key];
        if (idx === undefined) continue;
        const isActive = key === dominant;
        const speed = isActive ? activeSpeed : releaseSpeed;
        const target = isActive ? 1 : 0;
        inf[idx] = MathUtils.lerp(inf[idx], target, speed);
      }
    });
  });
}
