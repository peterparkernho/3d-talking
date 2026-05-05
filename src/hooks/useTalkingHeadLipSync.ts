import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { SkinnedMesh } from 'three';
import { VISEMES, type VisemeKey } from '@/lib/lipsync/visemeMap';
import {
  findActiveViseme,
  type ScheduledViseme,
} from '@/lib/lipsync/visemeTimeline';

const ACTIVE_DAMP = 0.4;
const RELEASE_DAMP = 0.2;

type IndexLookup = Map<SkinnedMesh, Partial<Record<VisemeKey, number>>>;

interface Args {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  timeline: ScheduledViseme[];
}

export function useTalkingHeadLipSync(
  meshesRef: React.RefObject<SkinnedMesh[]>,
  { audioRef, isPlaying, timeline }: Args,
) {
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
      console.warn('[useTalkingHeadLipSync] no meshes with viseme_* morph targets.');
    }
  }, [meshesRef]);

  useFrame(() => {
    const lookup = lookupRef.current;
    if (!lookup) return;
    const audio = audioRef.current;
    const active =
      isPlaying && audio && timeline.length > 0
        ? findActiveViseme(timeline, audio.currentTime)
        : null;

    lookup.forEach((map, mesh) => {
      const inf = mesh.morphTargetInfluences;
      if (!inf) return;
      for (const key of VISEMES) {
        const idx = map[key];
        if (idx === undefined) continue;
        const isActive = key === active;
        const speed = isActive ? ACTIVE_DAMP : RELEASE_DAMP;
        const target = isActive ? 1 : 0;
        inf[idx] = MathUtils.lerp(inf[idx], target, speed);
      }
    });
  });
}
