import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { AvatarRig } from '@/lib/avatar/rig';
import { type VisemeKey } from '@/lib/lipsync/visemeMap';
import {
  computeVisemeWeights,
  type ScheduledViseme,
} from '@/lib/lipsync/visemeTimeline';
import { readVolume } from '@/lib/lipsync/audioAnalyser';

const VOLUME_FLOOR = 0.45;
const VOLUME_CEIL = 0.18;
const VOLUME_DAMP = 12;

interface Args {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  timeline: ScheduledViseme[];
}

export function useTalkingHeadLipSync(
  rig: AvatarRig | null,
  { audioRef, analyserRef, isPlaying, timeline }: Args,
) {
  const visemeBuf = useMemo(() => new Map<VisemeKey, number>(), []);
  const smoothedVolumeRef = useRef(0);

  useFrame((_, delta) => {
    if (!rig) return;
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
      smoothedVolumeRef.current = MathUtils.damp(
        smoothedVolumeRef.current,
        target,
        VOLUME_DAMP,
        delta,
      );
      volumeGain = smoothedVolumeRef.current;
    } else {
      smoothedVolumeRef.current = MathUtils.damp(
        smoothedVolumeRef.current,
        0,
        VOLUME_DAMP,
        delta,
      );
    }

    rig.applyMouthVisemes(visemeWeights, volumeGain, delta);
  });
}
