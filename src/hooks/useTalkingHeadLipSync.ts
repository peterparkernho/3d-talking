import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { SkinnedMesh } from 'three';
import { VISEMES, type VisemeKey } from '@/lib/lipsync/visemeMap';
import {
  computeVisemeWeights,
  type ScheduledViseme,
} from '@/lib/lipsync/visemeTimeline';
import { readVolume } from '@/lib/lipsync/audioAnalyser';

/** Frame-rate-independent damping. Higher = faster tracking. */
const DAMP_LAMBDA = 18;
/** Floor on volume gain so quiet syllables still show shape. */
const VOLUME_FLOOR = 0.45;
/** Volume above this maps to full mouth intensity. */
const VOLUME_CEIL = 0.18;

type IndexLookup = Map<SkinnedMesh, Partial<Record<VisemeKey, number>>>;

interface Args {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  timeline: ScheduledViseme[];
}

export function useTalkingHeadLipSync(
  meshesRef: React.RefObject<SkinnedMesh[]>,
  { audioRef, analyserRef, isPlaying, timeline }: Args,
) {
  const lookupRef = useRef<IndexLookup | null>(null);
  const weightsBuf = useMemo(() => new Map<VisemeKey, number>(), []);
  const smoothedVolumeRef = useRef(0);

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

  useFrame((_, delta) => {
    const lookup = lookupRef.current;
    if (!lookup) return;
    const audio = audioRef.current;
    const analyser = analyserRef.current;

    const weights =
      isPlaying && audio && timeline.length > 0
        ? computeVisemeWeights(timeline, audio.currentTime, weightsBuf)
        : null;

    let volumeGain = 0;
    if (isPlaying && analyser) {
      const raw = readVolume(analyser);
      const norm = Math.min(1, raw / VOLUME_CEIL);
      const target = VOLUME_FLOOR + (1 - VOLUME_FLOOR) * norm;
      smoothedVolumeRef.current = MathUtils.damp(
        smoothedVolumeRef.current,
        target,
        12,
        delta,
      );
      volumeGain = smoothedVolumeRef.current;
    } else {
      smoothedVolumeRef.current = MathUtils.damp(
        smoothedVolumeRef.current,
        0,
        12,
        delta,
      );
    }

    lookup.forEach((map, mesh) => {
      const inf = mesh.morphTargetInfluences;
      if (!inf) return;
      for (const key of VISEMES) {
        const idx = map[key];
        if (idx === undefined) continue;
        const blended = weights?.get(key) ?? 0;
        const target = blended * volumeGain;
        inf[idx] = MathUtils.damp(inf[idx], target, DAMP_LAMBDA, delta);
      }
    });
  });
}
