import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { VRM } from '@pixiv/three-vrm';
import {
  VISEMES,
  VISEME_TO_VRM,
  VRM_MOUTH_EXPRESSIONS,
  type VisemeKey,
  type VrmMouthExpression,
} from '@/lib/lipsync/visemeMap';
import {
  computeVisemeWeights,
  type ScheduledViseme,
} from '@/lib/lipsync/visemeTimeline';
import { readVolume } from '@/lib/lipsync/audioAnalyser';

const DAMP_LAMBDA = 18;
const VOLUME_FLOOR = 0.45;
const VOLUME_CEIL = 0.18;

interface Args {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  timeline: ScheduledViseme[];
}

export function useTalkingHeadLipSync(
  vrm: VRM | null,
  { audioRef, analyserRef, isPlaying, timeline }: Args,
) {
  const visemeBuf = useMemo(() => new Map<VisemeKey, number>(), []);
  const mouthBuf = useMemo(
    () => new Map<VrmMouthExpression, number>(VRM_MOUTH_EXPRESSIONS.map((k) => [k, 0])),
    [],
  );
  const smoothedRef = useRef<Record<VrmMouthExpression, number>>({
    aa: 0,
    ih: 0,
    ou: 0,
    ee: 0,
    oh: 0,
  });
  const smoothedVolumeRef = useRef(0);

  useFrame((_, delta) => {
    if (!vrm?.expressionManager) return;

    const audio = audioRef.current;
    const analyser = analyserRef.current;

    const visemeWeights =
      isPlaying && audio && timeline.length > 0
        ? computeVisemeWeights(timeline, audio.currentTime, visemeBuf)
        : null;

    let volumeGain = 0;
    if (isPlaying && analyser) {
      const raw = readVolume(analyser);
      const norm = Math.min(1, raw / VOLUME_CEIL);
      const target = VOLUME_FLOOR + (1 - VOLUME_FLOOR) * norm;
      smoothedVolumeRef.current = MathUtils.damp(smoothedVolumeRef.current, target, 12, delta);
      volumeGain = smoothedVolumeRef.current;
    } else {
      smoothedVolumeRef.current = MathUtils.damp(smoothedVolumeRef.current, 0, 12, delta);
    }

    for (const k of VRM_MOUTH_EXPRESSIONS) mouthBuf.set(k, 0);
    if (visemeWeights) {
      for (const v of VISEMES) {
        const w = visemeWeights.get(v);
        if (!w) continue;
        const mapping = VISEME_TO_VRM[v];
        for (const expr of VRM_MOUTH_EXPRESSIONS) {
          const m = mapping[expr];
          if (!m) continue;
          mouthBuf.set(expr, (mouthBuf.get(expr) ?? 0) + w * m);
        }
      }
    }

    const smoothed = smoothedRef.current;
    for (const expr of VRM_MOUTH_EXPRESSIONS) {
      const target = (mouthBuf.get(expr) ?? 0) * volumeGain;
      smoothed[expr] = MathUtils.damp(smoothed[expr], target, DAMP_LAMBDA, delta);
      vrm.expressionManager.setValue(expr, smoothed[expr]);
    }
  });
}
